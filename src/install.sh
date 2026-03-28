#!/bin/sh
# Secure Caddy Installer
# Downloads Caddy from official GitHub Releases (caddyserver/caddy)
# Verifies SHA512 checksums and optionally Cosign signatures
#
# Usage:
#   curl -fsSL https://caddyserver.com/install.sh | sh
#   curl -fsSL https://caddyserver.com/install.sh | sh -s -- --dry-run
#   curl -fsSL https://caddyserver.com/install.sh | sh -s -- --version v2.11.2
#
# All downloads come exclusively from github.com/caddyserver/caddy
# No third-party domains are contacted.

set -eu

GITHUB_REPO="caddyserver/caddy"
GITHUB_API="https://api.github.com/repos/${GITHUB_REPO}"
GITHUB_RELEASES="https://github.com/${GITHUB_REPO}/releases/download"
INSTALL_DIR="/usr/local/bin"
DRY_RUN=false
VERSION=""

# --- Helpers ---

log()   { printf '[caddy-install] %s\n' "$*"; }
warn()  { printf '[caddy-install] WARNING: %s\n' "$*" >&2; }
die()   { printf '[caddy-install] ERROR: %s\n' "$*" >&2; exit 1; }

need_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

# --- Argument parsing ---

while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run)   DRY_RUN=true ;;
        --version)   shift; VERSION="$1" ;;
        --install-dir) shift; INSTALL_DIR="$1" ;;
        --help|-h)
            printf 'Usage: install.sh [--dry-run] [--version vX.Y.Z] [--install-dir /path]\n'
            exit 0
            ;;
        *) die "unknown option: $1" ;;
    esac
    shift
done

# --- Detect platform ---

detect_os() {
    os="$(uname -s | tr '[:upper:]' '[:lower:]')"
    case "$os" in
        linux*)   echo "linux" ;;
        darwin*)  echo "mac" ;;
        freebsd*) echo "freebsd" ;;
        *)        die "unsupported OS: $os" ;;
    esac
}

detect_arch() {
    arch="$(uname -m)"
    case "$arch" in
        x86_64|amd64)       echo "amd64" ;;
        aarch64|arm64)      echo "arm64" ;;
        armv7*)             echo "armv7" ;;
        armv6*)             echo "armv6" ;;
        armv5*)             echo "armv5" ;;
        s390x)              echo "s390x" ;;
        ppc64le)            echo "ppc64le" ;;
        riscv64)            echo "riscv64" ;;
        *)                  die "unsupported architecture: $arch" ;;
    esac
}

# --- Fetch latest version ---

fetch_latest_version() {
    url="${GITHUB_API}/releases/latest"
    log "fetching latest release from ${url}" >&2
    tag=$(curl -fsSL "$url" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    [ -n "$tag" ] || die "could not determine latest release tag"
    echo "$tag"
}

# --- Main ---

main() {
    need_cmd curl
    need_cmd tar
    need_cmd mktemp

    OS=$(detect_os)
    ARCH=$(detect_arch)

    if [ -z "$VERSION" ]; then
        VERSION=$(fetch_latest_version)
    fi

    # Strip leading 'v' for asset filenames
    version_num="${VERSION#v}"

    # Determine file extension
    ext="tar.gz"

    asset_name="caddy_${version_num}_${OS}_${ARCH}.${ext}"
    checksums_name="caddy_${version_num}_checksums.txt"

    asset_url="${GITHUB_RELEASES}/${VERSION}/${asset_name}"
    checksums_url="${GITHUB_RELEASES}/${VERSION}/${checksums_name}"

    log "platform:  ${OS}/${ARCH}"
    log "version:   ${VERSION}"
    log "asset:     ${asset_name}"
    log "source:    ${asset_url}"
    log ""
    log "all downloads from: github.com/${GITHUB_REPO}"
    log "build provenance:   github.com/${GITHUB_REPO}/actions"

    if [ "$DRY_RUN" = true ]; then
        log ""
        log "[DRY RUN] would download:"
        log "  ${asset_url}"
        log "  ${checksums_url}"

        if command -v cosign >/dev/null 2>&1; then
            log "  ${GITHUB_RELEASES}/${VERSION}/${checksums_name}.sig"
            log "  ${GITHUB_RELEASES}/${VERSION}/${checksums_name}.pem"
            log "[DRY RUN] would verify cosign signature"
        else
            log "[DRY RUN] cosign not found, would skip signature verification"
        fi

        log "[DRY RUN] would verify SHA512 checksum"
        log "[DRY RUN] would install to ${INSTALL_DIR}/caddy"
        exit 0
    fi

    # Create temporary directory
    tmpdir=$(mktemp -d)
    trap 'rm -rf "$tmpdir"' EXIT

    # Download asset and checksums
    log ""
    log "downloading ${asset_name} ..."
    curl -fSL -o "${tmpdir}/${asset_name}" "$asset_url" || die "failed to download ${asset_url}"

    log "downloading ${checksums_name} ..."
    curl -fSL -o "${tmpdir}/${checksums_name}" "$checksums_url" || die "failed to download ${checksums_url}"

    # --- Cosign signature verification (optional) ---
    if command -v cosign >/dev/null 2>&1; then
        sig_url="${GITHUB_RELEASES}/${VERSION}/${checksums_name}.sig"
        pem_url="${GITHUB_RELEASES}/${VERSION}/${checksums_name}.pem"

        log ""
        log "cosign found, verifying signature on checksums file ..."
        curl -fSL -o "${tmpdir}/${checksums_name}.sig" "$sig_url" || die "failed to download signature"
        curl -fSL -o "${tmpdir}/${checksums_name}.pem" "$pem_url" || die "failed to download certificate"

        cosign verify-blob \
            --signature "${tmpdir}/${checksums_name}.sig" \
            --certificate "${tmpdir}/${checksums_name}.pem" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            --certificate-identity-regexp "^https://github.com/${GITHUB_REPO}/.*" \
            "${tmpdir}/${checksums_name}" \
            || die "SIGNATURE VERIFICATION FAILED — checksums file may be tampered"

        log "signature verified: checksums file is authentic (signed by GitHub Actions)"
    else
        warn "cosign not installed — skipping signature verification"
        warn "install cosign for full supply chain verification: https://docs.sigstore.dev/cosign/system_config/installation/"
    fi

    # --- SHA512 checksum verification ---
    log ""
    log "verifying SHA512 checksum ..."

    expected_hash=$(grep "${asset_name}" "${tmpdir}/${checksums_name}" | awk '{print $1}')
    [ -n "$expected_hash" ] || die "asset ${asset_name} not found in checksums file"

    if command -v sha512sum >/dev/null 2>&1; then
        actual_hash=$(sha512sum "${tmpdir}/${asset_name}" | awk '{print $1}')
    elif command -v shasum >/dev/null 2>&1; then
        actual_hash=$(shasum -a 512 "${tmpdir}/${asset_name}" | awk '{print $1}')
    else
        die "no sha512sum or shasum found — cannot verify checksum"
    fi

    if [ "$expected_hash" != "$actual_hash" ]; then
        log "expected: ${expected_hash}"
        log "actual:   ${actual_hash}"
        die "CHECKSUM MISMATCH — download may be corrupted or tampered"
    fi

    log "checksum verified: ${expected_hash}"

    # --- Extract and install ---
    log ""
    log "extracting ${asset_name} ..."
    tar -xzf "${tmpdir}/${asset_name}" -C "${tmpdir}"

    [ -f "${tmpdir}/caddy" ] || die "caddy binary not found in archive"

    if [ -w "$INSTALL_DIR" ]; then
        install -m 755 "${tmpdir}/caddy" "${INSTALL_DIR}/caddy"
    else
        log "installing to ${INSTALL_DIR} requires elevated privileges"
        sudo install -m 755 "${tmpdir}/caddy" "${INSTALL_DIR}/caddy"
    fi

    log ""
    log "caddy ${VERSION} installed to ${INSTALL_DIR}/caddy"
    log ""
    log "verification summary:"
    log "  source:    github.com/${GITHUB_REPO}/releases/tag/${VERSION}"
    log "  artifact:  ${asset_name}"
    log "  sha512:    ${expected_hash}"
    if command -v cosign >/dev/null 2>&1; then
        log "  signature: verified (cosign/sigstore)"
    else
        log "  signature: skipped (install cosign for full verification)"
    fi
    log ""
    log "run 'caddy version' to confirm installation"
}

main
