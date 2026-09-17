<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#F8F5EF">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title>Oh My Baby</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=IBM+Plex+Serif:ital,wght@0,600;1,600&display=swap" rel="stylesheet">

    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.jsx']); ?>
</head>
<body>
    <div id="root"></div>
</body>
</html>
<?php /**PATH C:\My_data\neew\OH_MY_BABY_VISUAL_FIX_V6_2026-09-13\website\resources\views/welcome.blade.php ENDPATH**/ ?>