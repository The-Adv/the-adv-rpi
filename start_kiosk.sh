#!/bin/bash

xset s noblank
xset s off
xset -dpms

chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5000