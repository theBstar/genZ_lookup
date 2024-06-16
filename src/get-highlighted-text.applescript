-- get-highlighted-text.applescript
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
end tell

tell application frontApp
    activate
    tell application "System Events" to keystroke "c" using {command down}
end tell

delay 0.5
set highlightedText to the clipboard
highlightedText
