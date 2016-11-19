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

    var originalImg = new Image;

    // Draw video screenshot in canvas
    context.drawImage(video, 0, 0, 640, 480); 
    // Create PNG image to upload
    var fullQualityImg = canvas.toDataURL("img/png", 1.0); 
    // Get image data from canvas context, and get its raw pixel data
    var imgData = context.getImageData(0, 0, canvas.width, canvas.height); 
    var data = imgData.data;
    $.post('/upload', {
        img : fullQualityImg
    })
    console.log(data);
    // Turn blue bits transparent
    for (var i = 0; i < data.length; i += 4) {
        // data: one-dimensional array containing the data in the RGBA order
        if (data[i] >= 75 && data[i] <=76 && data[i + 1] == 65 && data[i + 2] >= 252) {
            // These 4 values make up a blue pixel: red within [75, 76], green within [65], blue within [252, 254]
            data[i + 3] = 0; // set alpha value to 0
        }
    }
    console.log(data); // Data is now partially transparent

    // Auto-crop the image (imgData)
    var w = canvas.width,
        h = canvas.height,
    pix = {x:[], y:[]},
    x, y, index;

    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            index = (y * w + x) * 4;
            if (imgData.data[index+3] > 0) {

                pix.x.push(x);
                pix.y.push(y);

            }   
        }
    }
    pix.x.sort(function(a,b){return a-b});
    pix.y.sort(function(a,b){return a-b});
    var n = pix.x.length-1;

    w = pix.x[n] - pix.x[0];
    h = pix.y[n] - pix.y[0];

    // Cut from context
    var cut = context.getImageData(pix.x[0], pix.y[0], w, h);

    // Resize canvas to fit new cropped dimensions
    canvas.width = w;
    canvas.height = h;
    context.putImageData(cut, 0, 0);

    // Get PNG
    // var image = canvas.toDataURL();


});
