// enums
var ColorMapTypeEnum = {
    GRAY_SCALE: 1,
    JIT: 2,
};

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
    this.name = "";
    this.fileRef = fileRef;
    this.loaded = false;
    this.originalImageData = null;
    this.colored = false;
    this.coloredImageData = null;
    this.imageRegions = [];
    this.description = "";
};

// global variables
var gImageList = [];
var gCurrentImageInfo = null;
var gCurrentImageInfoRegions = null;
var gImageInfoCounter = 0;
var gMainCanvas = document.getElementById("image_canvas");
var gMainCanvasContext = gMainCanvas.getContext("2d");
var gRegionDrawingStarted = false;
var gSelectionImageRegion = new ImageRegion();
var gCurrentColorMapType = ColorMapTypeEnum.GRAY_SCALE;
var gImageSelector = document.getElementById("selImages");
var gImageRegionsSelector = document.getElementById("selImageRegions");
var gRegionPreview = document.getElementById("region_preview");


// set colored flags for all images
function SetColoredFlags(value = false) {
    for (var i = 0; i < gImageList.length; i++) {
        gImageList[i].colored = value;
    }
}

// fray scale to JIT
function GrayScaleToJit(value) {
    var t = ((value - 127.0) / 255.0) * 2.0;
    var result = {};
    result.r = Clamp(1.5 - Math.abs(2.0 * t - 1.0), 0, 1);
    result.g = Clamp(1.5 - Math.abs(2.0 * t), 0, 1);
    result.b = Clamp(1.5 - Math.abs(2.0 * t + 1.0), 0, 1);
    return result;
}

// apply color map
function ApplyColorMap(imageInfo) {
    imageInfo.colored = true;
    for (var i = 0; i < imageInfo.coloredImageData.data.length; i += 4) {
        // jit color map
        if (gCurrentColorMapType === ColorMapTypeEnum.JIT) {
            var color = GrayScaleToJit(imageInfo.originalImageData.data[i + 1]); // get green value
            imageInfo.coloredImageData.data[i + 0] = color.r * 255;
            imageInfo.coloredImageData.data[i + 1] = color.g * 255;
            imageInfo.coloredImageData.data[i + 2] = color.b * 255;
            imageInfo.coloredImageData.data[i + 3] = 255;
        } else {
            console.log("unsupported color map type");
        }
    }
}

// draw current image
function DrawImage(imageInfo) {
    if (imageInfo !== null) {
        gMainCanvas.width = imageInfo.originalImageData.width;
        gMainCanvas.height = imageInfo.originalImageData.height;
        // draw original image
        if (gCurrentColorMapType === ColorMapTypeEnum.GRAY_SCALE) {
            gMainCanvasContext.putImageData(imageInfo.originalImageData, 0, 0);
        } else {
            // draw colored image
            if (!imageInfo.colored)
                ApplyColorMap(imageInfo);
            gMainCanvasContext.putImageData(imageInfo.coloredImageData, 0, 0);
        }
    }
}

// draw current image
function DrawImageRegions(imageInfo) {
    if (imageInfo !== null) {
        for (var i = 0; i < imageInfo.imageRegions.length; i++) {
            DrawImageRegion(imageInfo.imageRegions[i]);
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
function ShowImage(imageInfo) {
    gCurrentImageInfo = imageInfo;
    if (gCurrentImageInfo.loaded) {
        DrawImage(gCurrentImageInfo);
        DrawImageRegions(gCurrentImageInfo);
    } else {
        var fileReader = new FileReader();
        fileReader.imageInfo = imageInfo;
        fileReader.onload = function (event) {
            var image = new Image();
            image.imageInfo1 = event.target.imageInfo;
            image.onload = function (event) {
                // extract image data
                var canvas = document.createElement('canvas');
                canvas.width = event.target.width;
                canvas.height = event.target.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(event.target, 0, 0);

                // set image data to image info
                gCurrentImageInfo.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                gCurrentImageInfo.coloredImageData = new ImageData(canvas.width, canvas.height);
                gCurrentImageInfo.loaded = true;
                DrawImage(gCurrentImageInfo);
                DrawImageRegions(gCurrentImageInfo);
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
                AddImageInfoToSelector(imageInfo);
                gImageInfoCounter++;
            }
            UpdateRegionPreview(gImageList[gImageRegionsSelector.selectedIndex])
        }
        invisible_file_input.click();
    }
}

//--------------------------------------------------------------------------
// events
//--------------------------------------------------------------------------

function ColorMapClick() {
    if (document.getElementById("rbGrayScale").checked) {
        gCurrentColorMapType = ColorMapTypeEnum.GRAY_SCALE;
    } else {
        SetColoredFlags(false);
        gCurrentColorMapType = ColorMapTypeEnum.JIT;
    }
    // draw all current stuff
    ShowImage(gCurrentImageInfo);
}

//  onmouseup
gMainCanvas.onmouseup = function (evt) {
    if (gRegionDrawingStarted) {
        if ((Math.abs(gSelectionImageRegion.width) > 16) || (Math.abs(gSelectionImageRegion.width) > 16)) {
            // copy region 
            var imageRegion = new ImageRegion();
            imageRegion.color = gSelectionImageRegion.color;
            imageRegion.x = gSelectionImageRegion.x;
            imageRegion.y = gSelectionImageRegion.y;
            imageRegion.width = gSelectionImageRegion.width;
            imageRegion.height = gSelectionImageRegion.height;

            // add to list
            gCurrentImageInfo.imageRegions.push(imageRegion);
        } else {
            alert("Region is too small");
        }
        // draw all current stuff
        DrawImage(gCurrentImageInfo);
        DrawImageRegions(gCurrentImageInfo);

        // Update Region Preview
        if (gCurrentImageInfo === gCurrentImageInfoRegions)
            UpdateRegionPreview(gCurrentImageInfoRegions);
    }
    gRegionDrawingStarted = false;
}

// onmousedown
gMainCanvas.onmousedown = function (evt) {
    gRegionDrawingStarted = true;

    // get mouse coords
    var mouseCoords = GetMousePosByElement(gMainCanvas, evt);

    // set new image region
    gSelectionImageRegion.x = mouseCoords.x;
    gSelectionImageRegion.y = mouseCoords.y;
    gSelectionImageRegion.color = GetRandomColor();
    gSelectionImageRegion.width = 0;
    gSelectionImageRegion.height = 0;
}

// onmousemove
gMainCanvas.onmousemove = function (evt) {
    if (gRegionDrawingStarted === true) {
        var mouseCoords = GetMousePosByElement(gMainCanvas, evt);
        gSelectionImageRegion.width = mouseCoords.x - gSelectionImageRegion.x;
        gSelectionImageRegion.height = mouseCoords.y - gSelectionImageRegion.y;
        DrawImage(gCurrentImageInfo);
        DrawImageRegions(gCurrentImageInfo);
        DrawImageRegion(gSelectionImageRegion);
    }
}

gImageSelector.onchange = function (evt) {
    ShowImage(gImageList[gImageSelector.selectedIndex]);
}

gImageRegionsSelector.onchange = function (evt) {
    UpdateRegionPreview(gImageList[gImageRegionsSelector.selectedIndex]);
}

//--------------------------------------------------------------------------
// utils
//--------------------------------------------------------------------------

// uodate region preview
function UpdateRegionPreview(imageInfo) {
    // set current image info regions
    gCurrentImageInfoRegions = imageInfo;

    // clear preview
    while (gRegionPreview.firstChild) {
        gRegionPreview.removeChild(gRegionPreview.firstChild);
    }

    // check for null
    if (gCurrentImageInfoRegions === null) 
        return;

    // itarate by regions
    for (var i = 0; i < imageInfo.imageRegions.length; i++) {
        gRegionPreview.innerHTML += 
            "(" + 
            imageInfo.imageRegions[i].x + ";" +
            imageInfo.imageRegions[i].y + ")" +
            "<br></br>";
    }
}

// add new image info to selector
function AddImageInfoToSelector(imageInfo) {
    // create new selector
    var selectorImage = document.createElement('option');
    selectorImage.value = imageInfo.fileRef;
    selectorImage.innerHTML = imageInfo.fileRef.name;
    gImageSelector.appendChild(selectorImage);

    // create new selector
    var selectorImageRegions = document.createElement('option');
    selectorImageRegions.value = imageInfo.fileRef;
    selectorImageRegions.innerHTML = imageInfo.fileRef.name;
    gImageRegionsSelector.appendChild(selectorImageRegions);
}

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

// clamp, just clamp
function Clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
};
