var video = document.getElementById('video');

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var errBack = function(e) {
    console.log('An error has occurred!', e)
};

/******************************** main ****************************************/

function makeBlob(dataURL) {
    var parts = dataURL.split(';base64,');
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    
    var uInt8Array = new Uint8Array(rawLength);
    for (var i = 0; i < rawLength; i++) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

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
    var id = $('#idtext').val();
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

    // Turn blue bits transparent
    for (var i = 0; i < data.length; i += 4) {
        // data: one-dimensional array containing the data in the RGBA order
        if (data[i] >= 75 && data[i] <=76 && data[i + 1] == 65 && data[i + 2] >= 252) {
            // These 4 values make up a blue pixel: red within [75, 76], green within [65], blue within [252, 254]
            data[i + 3] = 0; // set alpha value to 0
        }
    }
    // console.log(data); // Data is now partially transparent

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

    /******************************** Get Face Rectangle ******************************/
    // Get PNG
    // var image = canvas.toDataURL("img/png", 1.0);


    $.ajax({
        type: "POST",
        url : "https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Faces,Description&language=en",
        headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": "5ac294bfeee8467f8680e0f6f8b661c2"
        },
        data : makeBlob(canvas.toDataURL('image/jpeg')),
        processData: false
    }).done(function(data) {
        console.info(JSON.stringify(data));
        // Before cutting out the face, get tags!

        var tags = data.description.tags;
        var filteredTags;

        function checkTag(tag) {
            var clothingTags = ["dress", "shirt", "tie", "suit", "jeans", "skirt", "jacket"];;
            return (clothingTags.indexOf(tag) >= 0); // Whether tag is in clothingTags
        }

        filteredTags = tags.filter(checkTag);

        /*** fucking finally get face rectangle ***/
        var face = data.faces[0];
        var rect = face.faceRectangle;
        var y_min = rect.top + rect.height;
        
        var w = canvas.width,
            h = canvas.height;

        // Cut from context
        var cut = context.getImageData(0, y_min+50, w, h-y_min-50);

        // Resize canvas to fit new cropped dimensions
        canvas.width = w;
        canvas.height = h-y_min-50;
        context.putImageData(cut, 0, 0);
        var age = face.age;
        var gender = face.gender;

        // getAverageRGB {
            
        var blockSize = 2, // only visit every 5 pixels
            data, 
            i = -4,
            length,
            rgb = {r:0,g:0,b:0},
            count = 0;
        var w = canvas.width,
            h = canvas.height;
            
        data = context.getImageData(w/2 - 30, 0 +h/2 - 30, 60, 60);

        length = data.data.length;
        
        while ( (i += blockSize * 4) < length ) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i+1];
            rgb.b += data.data[i+2];
        }
        
        // ~~ used to floor values
        rgb.r = ~~(rgb.r/count);
        rgb.g = ~~(rgb.g/count);
        rgb.b = ~~(rgb.b/count);
        console.log(rgb);
        var rgbstring = '#' + ("0" + parseInt(rgb.r,10).toString(16)).slice(-2) +
          ("0" + parseInt(rgb.g,10).toString(16)).slice(-2) +
          ("0" + parseInt(rgb.b,10).toString(16)).slice(-2);

        /*** FUCKING FINALLY SEND FUCKING DATA ***/
        
        var dataJSON = new Object();
        dataJSON.id = id;
        dataJSON.gender = gender;
        dataJSON.age = age;
        dataJSON.color = rgbstring;
        dataJSON.tags = filteredTags;

        console.log("dataJSON");
        console.log(dataJSON);
        var dataJSONstring = JSON.stringify(dataJSON);

        $.ajax({
            type: "POST",
            url : "/android",
            headers: {
                "Content-Type": "application/json"
            },
            data : dataJSONstring,
            processData: false
        }).done(function(data) {
            console.info(JSON.stringify(data));
            console.info("sent to android, finally");

            
        }).fail(function(data) {
            console.error(JSON.stringify(data));
        });

    }).fail(function(data) {
        console.error(JSON.stringify(data));
    });



    console.log("whut");

});
