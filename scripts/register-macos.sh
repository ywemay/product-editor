#!/usr/bin/env bash
# register-macos.sh — Register .prod file association on macOS
# Run after copying Products-Editor.app to /Applications.
#
# Usage: ./register-macos.sh [/Applications/Products-Editor.app]

set -e

APP_PATH="${1:-/Applications/Products-Editor.app}"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ App not found at: $APP_PATH"
    echo "Usage: $0 /path/to/Products-Editor.app"
    exit 1
fi

APP_BUNDLE_ID="com.ywemay.products-editor"

# Register the .prod UTI using the app's Info.plist
# The plist needs LSItemContentTypes + UTExportedTypeDeclarations
PLIST="$APP_PATH/Contents/Info.plist"

# Check if already registered
if /usr/libexec/PlistBuddy -c "Print :CFBundleDocumentTypes" "$PLIST" &>/dev/null; then
    echo "ℹ️  Document types already in Info.plist"
else
    echo "📝 Adding document type to Info.plist..."

    # Add document type entry
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes array" "$PLIST" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0 dict" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:CFBundleTypeName string 'Product File'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:LSHandlerRank string 'Owner'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes array" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes:0 string 'com.ywemay.prod'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:CFBundleTypeExtensions array" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:CFBundleTypeExtensions:0 string 'prod'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDocumentTypes:0:CFBundleTypeRole string 'Editor'" "$PLIST"

    # Add UTI export
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations array" "$PLIST" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0 dict" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeIdentifier string 'com.ywemay.prod'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeDescription string 'Product File'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeConformsTo array" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeConformsTo:0 string 'public.data'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification dict" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension array" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension:0 string 'prod'" "$PLIST"
fi

# Register with Launch Services
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -R -f "$APP_PATH" 2>/dev/null || true

echo "✅ .prod file association registered on macOS"
echo "   Double-click a .prod file to open with Products Editor"
echo ""
echo "Note: You may need to log out/in for changes to take effect."
echo "Alternatively run: /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain user"
