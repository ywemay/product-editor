#!/usr/bin/env bash
# register-linux.sh — Register .prod file association on Linux
# Run after installing the app binary.
#
# Usage: ./register-linux.sh /path/to/Products-Editor-Linux

set -e

APP_BIN="${1:-$(dirname "$0")/../dist/Products-Editor-Linux/Products-Editor-Linux}"
APP_BIN="$(realpath "$APP_BIN" 2>/dev/null || echo "$APP_BIN")"

if [ ! -f "$APP_BIN" ]; then
    echo "❌ App binary not found at: $APP_BIN"
    echo "Usage: $0 /path/to/Products-Editor-Linux"
    exit 1
fi

APP_DIR="$(dirname "$(realpath "$APP_BIN")")"
ICON_PATH="$APP_DIR/../app.icns"

# Create .desktop entry
APP_ID="products-editor"

mkdir -p ~/.local/share/applications
mkdir -p ~/.local/share/mime/packages

# MIME type definition
cat > ~/.local/share/mime/packages/application-x-prod.xml << 'XMLEOF'
<?xml version="1.0"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/x-prod">
    <comment>Product file</comment>
    <glob pattern="*.prod"/>
    <icon name="application-x-prod"/>
  </mime-type>
</mime-info>
XMLEOF

# Desktop entry
cat > ~/.local/share/applications/products-editor.desktop << DESKTOPEOF
[Desktop Entry]
Type=Application
Name=Products Editor
Comment=Edit .prod product files
Exec="$APP_BIN" %f
Icon=${ICON_PATH}
Terminal=false
Categories=Office;Database;
MimeType=application/x-prod;
NoDisplay=false
DESKTOPEOF

# Apply
update-mime-database ~/.local/share/mime 2>/dev/null || true
update-desktop-database ~/.local/share/applications 2>/dev/null || true
xdg-mime default products-editor.desktop application/x-prod 2>/dev/null || true

echo "✅ .prod file association registered for $(whoami)"
echo "   Double-click a .prod file to open with Products Editor"
