<?php
set_time_limit(0);
ignore_user_abort(true);

$streamUrl = 'https://ts-j8bh.onrender.com/box.ts?id=4';
$streamName = 'starsports1tamil';

$baseDir = __DIR__ . "/m3u8/$streamName";
$segmentDuration = 8; // seconds
$maxSegments = 5;
$bufferSize = 256 * 1024;

if (!file_exists($baseDir)) {
    mkdir($baseDir, 0777, true);
}

$segments = [];
$index = 1;

while (true) {
    $segmentName = "$streamName.$index.ts";
    $segmentPath = "$baseDir/$segmentName";
    $tempPath = "$segmentPath.part";

    echo "🎬 Writing segment: $segmentName\n";

    $in = @fopen($streamUrl, 'rb');
    if (!$in) {
        echo "⚠️ Stream not available. Retrying...\n";
        sleep(2);
        continue;
    }

    $out = fopen($tempPath, 'wb');
    $start = time();

    while ((time() - $start) < $segmentDuration) {
        $data = fread($in, $bufferSize);
        if (!$data) break;
        fwrite($out, $data);
        usleep(100000); // 0.1s delay to reduce CPU load
    }

    fclose($in);
    fclose($out);
    rename($tempPath, $segmentPath);

    // Add new segment to list
    $segments[] = $segmentName;

    // Delete old segments
    if (count($segments) > $maxSegments) {
        $old = array_shift($segments);
        @unlink("$baseDir/$old");
        echo "🗑️ Deleted old segment: $old\n";
    }

    // Write updated M3U8
    $m3u8 = "#EXTM3U\n";
    $m3u8 .= "#EXT-X-VERSION:3\n";
    $m3u8 .= "#EXT-X-TARGETDURATION:$segmentDuration\n";
    $m3u8 .= "#EXT-X-MEDIA-SEQUENCE:" . ($index - count($segments) + 1) . "\n";

    foreach ($segments as $seg) {
        $m3u8 .= "#EXTINF:$segmentDuration.0,\n$seg\n";
    }

    file_put_contents("$baseDir/$streamName.m3u8", $m3u8);
    clearstatcache();
    $index++;
}
