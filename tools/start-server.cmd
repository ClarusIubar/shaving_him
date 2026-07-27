@echo off
cd /d d:\Code305\shaving_him
echo Starting HTTP server on http://localhost:3000
echo Open http://localhost:3000 in your browser
python -m http.server 3000
pause