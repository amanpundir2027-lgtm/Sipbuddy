SipBuddy 1.3.0 makes avatar changes easier to find inside the Windows app. Click **Change my avatar** on Overview, open **My buddy**, or right-click the tray droplet → **Change my avatar…**. Upload an existing PNG/JPEG/WebP avatar and click **Use my avatar**. No AI generation or credits are used.

This release adds an update client. From 1.3.0 onward, the app checks for future releases and offers **Check for updates → Download update → Restart and install**. Downloads and restarts require user action. Avatar, preferences and water history remain in the same local profile.

**One-time upgrade:** versions 1.2.0 and earlier have no update client. Download and run **SipBuddy-Setup-1.3.0.exe** below without uninstalling. After that, future releases can be installed from the app. Website deployments alone do not update Windows installations.

The installer is **unsigned** and may show SmartScreen / unknown-publisher warnings. Automated coverage exercises avatar uploads, actual Electron overlays, update UI/IPC and update consent/error handling. A full packaged Windows-to-Windows upgrade and hands-on focus/click-through/mixed-DPI acceptance still require manual verification.
