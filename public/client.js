var video = document.getElementById('video');

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var errBack = function(e) {
    console.log('An error has occurred!', e)
};

// Get access to the camera!
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Not adding `{ audio: true }` since we only want video now
    navigator.mediaDevices.getUserMedia({
        video: true
    }).then(function(stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();
    });
}

var mediaConfig =  { video: true };

//
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(mediaConfig).then(function(stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();
    });
}

/* Legacy code below! */
else if (navigator.getUserMedia) { // Standard
    navigator.getUserMedia(mediaConfig, function(stream) {
        video.src = stream;
        video.play();
    }, errBack);
} else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
    navigator.webkitGetUserMedia(mediaConfig, function(stream) {
        video.src = window.webkitURL.createObjectURL(stream);
        video.play();
    }, errBack);
} else if (navigator.mozGetUserMedia) { // Mozilla-prefixed
    navigator.mozGetUserMedia(mediaConfig, function(stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();
    }, errBack);
}

// Trigger photo take
document.getElementById('snap').addEventListener('click', function() {
    //var fullQuality = canvas.toDataURL("image/jpeg", 1.0);

    var fullQualityImg = canvas.toDataURL("img/png", 1.0); // Data URI
    var originalImg = new Image;
    
    context.drawImage(video, 0, 0, 640, 480); // Draw video screenshot in canvas
    var imgData = context.getImageData(0, 0, canvas.width, canvas.height); // Get image data from canvas context
    var data = imgData.data;
    $.post('/upload', {
        img : fullQualityImg
    })
    console.log(data);
    for (var i = 0; i < data.length; i += 4) {
        // data: one-dimensional array containing the data in the RGBA order
        if (data[i] == 76 && data[i + 1] == 65 && data[i + 2] == 254) {
            data[i + 3] = 0; // set alpha value to 0
        }
    }
    console.log(data);
    context.putImageData(imgData, 0, 0);

});
