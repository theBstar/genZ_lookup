-- get-highlighted-text.applescript
tell application "System Events"
    keystroke "c" using {command down}
end tell
delay 0.5
set highlightedText to the clipboard
highlightedText
