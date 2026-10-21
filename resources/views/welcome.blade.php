<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#F8F5EF">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Oh My Baby</title>
    <link rel="icon" type="image/png" href="/images/brand/bear-mark.png">
    <link rel="apple-touch-icon" href="/images/brand/bear-mark.png">
    <style>
        body{margin:0;background:#F8F5EF}
        #boot{display:flex;min-height:100vh;align-items:center;justify-content:center;font:700 14px system-ui,sans-serif;letter-spacing:.3em;color:#6b5b53}
    </style>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=IBM+Plex+Serif:ital,wght@0,600;1,600&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="root"><div id="boot">OH MY BABY</div></div>
</body>
</html>
