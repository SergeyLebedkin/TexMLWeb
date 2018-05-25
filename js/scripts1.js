// Image Region
ImageRegion = function () {
    this.color = "red";
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
};

// Image File Info
ImageInfo = function (fileRef) {
    this.fileRef = fileRef;
    this.loaded = false;
    this.originalImageData = null;
    this.imageRegions = [];
    this.description = "";
};

// global variables
var gImageList = [];
var gCurrentImageInfo = null;
var gMainCanvas = document.getElementById("image_canvas");
var gMainCanvasContext = gMainCanvas.getContext("2d");
var gRegionDrawingStarted = false;
var gCurrentImageRegion = new ImageRegion();

// draw current image
function DrawImage(image) {
    if (image !== null) {
        gMainCanvas.width = image.originalImageData.width;
        gMainCanvas.height = image.originalImageData.height;
        gMainCanvasContext.drawImage(image.originalImageData, 0, 0);
    }
}

// draw current image
function DrawImageRegions(image) {
    if (image !== null) {
        for (var i = 0; i < image.imageRegions.length; i++) {
            DrawImageRegion(image.imageRegions[i]);
        }
    }
}

// draw image region
function DrawImageRegion(region) {
    if (region !== null) {
        // draw region
        gMainCanvasContext.globalAlpha = 0.8;
        gMainCanvasContext.fillStyle = region.color;
        gMainCanvasContext.fillRect(region.x, region.y, region.width, region.height);
        gMainCanvasContext.globalAlpha = 1.0;
    }
}

// show image
function ShowImage(imageIndex) {
    gCurrentImageInfo = gImageList[imageIndex];
    if (gCurrentImageInfo.loaded) {
        DrawImage(gCurrentImageInfo);
        DrawImageRegions(gCurrentImageInfo);
    } else {
        var fileReader = new FileReader();
        fileReader.onload = function (event) {
            var image = new Image();
            image.onload = function (event) {
                gCurrentImageInfo.originalImageData = event.target;
                gCurrentImageInfo.loaded = true;
                DrawImage(gCurrentImageInfo);
            }
            image.src = event.target.result;
        }
        fileReader.readAsDataURL(gCurrentImageInfo.fileRef);
    }
}

// load images button event
function load_image_btn() {
    if (invisible_file_input) {
        invisible_file_input.accept = '.jpg,.jpeg,.png,.bmp';
        invisible_file_input.onchange = function (event) {
            for (var i = 0; i < event.target.files.length; i++) {
                var imageInfo = new ImageInfo(event.target.files[i]);
                gImageList.push(imageInfo);
            }
            ShowImage(gImageList.length - 1);
        }
        invisible_file_input.click();
    }
}

//--------------------------------------------------------------------------
// events
//--------------------------------------------------------------------------

//  onmouseup
gMainCanvas.onmouseup = function (evt) {
    if (gRegionDrawingStarted) {
        if ((Math.abs(gCurrentImageRegion.width) > 16) || (Math.abs(gCurrentImageRegion.width) > 16)) {
            // copy region and add to list
            var imageRegion = new ImageRegion();
            imageRegion.color = gCurrentImageRegion.color;
            imageRegion.x = gCurrentImageRegion.x;
            imageRegion.y = gCurrentImageRegion.y;
            imageRegion.width = gCurrentImageRegion.width;
            imageRegion.height = gCurrentImageRegion.height;
            gCurrentImageInfo.imageRegions.push(imageRegion);
        } else {
            alert("Region is too small");
        }
        // draw all current stuff
        DrawImage(gCurrentImageInfo);
        DrawImageRegions(gCurrentImageInfo);
    }
    gRegionDrawingStarted = false;
}

// onmousedown
gMainCanvas.onmousedown = function (evt) {
    gRegionDrawingStarted = true;

    // get mouse coords
    var mouseCoords = GetMousePosByElement(gMainCanvas, evt);

    // set new image region
    gCurrentImageRegion.x = mouseCoords.x;
    gCurrentImageRegion.y = mouseCoords.y;
    gCurrentImageRegion.color = GetRandomColor();
    gCurrentImageRegion.width = 0;
    gCurrentImageRegion.height = 0;
}

// onmousemove
gMainCanvas.onmousemove = function (evt) {
    if (gRegionDrawingStarted === true) {
        var mouseCoords = GetMousePosByElement(gMainCanvas, evt);
        gCurrentImageRegion.width = mouseCoords.x - gCurrentImageRegion.x;
        gCurrentImageRegion.height = mouseCoords.y - gCurrentImageRegion.y;
        DrawImage(gCurrentImageInfo);
        DrawImageRegions(gCurrentImageInfo);
        DrawImageRegion(gCurrentImageRegion);
    }
}

//--------------------------------------------------------------------------
// utils
//--------------------------------------------------------------------------

// get mause position for element
function GetMousePosByElement(el, evt) {
    var rect = el.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

// get random color
function GetRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
