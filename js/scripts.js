// ColorMapTypeEnum
var ColorMapTypeEnum = {
    GRAY_SCALE: 1,
    JIT: 2
};

// SelectionModeEnum
var SelectionModeEnum = {
    ADD: 1,
    REMOVE: 2
}

// RegionInfo
class RegionInfo {
    constructor() {
        this.color = "red";
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }
}

// ImageInfo
class ImageInfo {
    constructor() {
        this.fileRef = null;
        this.image = null;
        this.descr = "";
        this.regions = [];
    }

    // load from file
    loadFromFile() {
        var fileReader = new FileReader();
        fileReader.imageInfo = this;
        fileReader.onload = function (event) {
            event.currentTarget.imageInfo.image = new Image();
            event.currentTarget.imageInfo.image.src = event.currentTarget.result;
        }
        fileReader.readAsDataURL(this.fileRef);
    }
}

// ImageListView
class ImageInfoListView {
    constructor(imageInfoList) {
        this.imageInfoList = imageInfoList;
        // get controls
        this.imageListContainer = document.getElementById("image_list_container");
    }

    // drawImageList
    update() {
        // just clear
        this.clear();

        // add new items
        for (var i = 0; i < this.imageInfoList.length; i++)
            this.addItemInfoListItem(this.imageInfoList[i]);
    }

    // addItemInfoListItem
    addItemInfoListItem(imageInfo) {
        if (imageInfo !== null) {
            // create new item
            var item = document.createElement("a");
            item.innerText = imageInfo.fileRef.name;
            item.onclick = imageInfoListItemClick;
            item.href = "#";
            item.imageInfo = imageInfo;
            // append to list
            this.imageListContainer.appendChild(item);
        }
    }

    // clear
    clear() {
        // clear childs
        while (this.imageListContainer.firstChild) {
            this.imageListContainer.removeChild(
                this.imageListContainer.firstChild
            );
        }
    }
}

// ImageInfoViewer
class ImageInfoViewer {
    constructor(parent) {
        this.imageInfo = null; // current raw image info
        this.imageBuffer = new Image(); // colored image buffer
        this.imageBuffer.imageInfoViewer = this;
        this.colorMapType = ColorMapTypeEnum.GRAY_SCALE;
        this.selectionStarted = false;
        this.selectionMode = SelectionModeEnum.ADD;
        this.selectionRegionInfo = new RegionInfo();

        // create controls
        this.parent = parent;
        this.imageCanvas = document.createElement("canvas");
        this.imageCanvas.style.border = "1px solid orange";
        this.imageCanvasCtx = this.imageCanvas.getContext('2d');
        this.parent.appendChild(this.imageCanvas);
        this.parent.imageInfoViewer = this;

        // add event - mousemove
        this.parent.addEventListener("mousemove", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;
            var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);

            // update selection region info
            if (imageInfoViewer.selectionStarted) {
                imageInfoViewer.selectionRegionInfo.width = mouseCoords.x - imageInfoViewer.selectionRegionInfo.x;
                imageInfoViewer.selectionRegionInfo.height = mouseCoords.y - imageInfoViewer.selectionRegionInfo.y;

                // redraw stuff
                imageInfoViewer.redraw();
                imageInfoViewer.drawSelectionRegion();
            }
        });
        // add event - mouseup
        this.parent.addEventListener("mouseup", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;
            var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);

            // proceed selection
            if (imageInfoViewer.selectionStarted) {
                // craete region info 
                var regionInfo = new RegionInfo();
                regionInfo.color  = imageInfoViewer.selectionRegionInfo.color;
                regionInfo.x      = imageInfoViewer.selectionRegionInfo.x;
                regionInfo.y      = imageInfoViewer.selectionRegionInfo.y;
                regionInfo.width  = imageInfoViewer.selectionRegionInfo.width;
                regionInfo.height = imageInfoViewer.selectionRegionInfo.height;
                imageInfoViewer.imageInfo.regions.push(regionInfo);

                // redraw all stuff
                imageInfoViewer.redraw();
            }
            imageInfoViewer.selectionStarted = false;
        });
        // add event - mousedown
        this.parent.addEventListener("mousedown", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;
            var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);

            // set selection state and setup selection region
            if (imageInfoViewer.imageInfo !== null) {
                imageInfoViewer.selectionStarted = true;
                imageInfoViewer.selectionRegionInfo.color = generateRandomColor();
                imageInfoViewer.selectionRegionInfo.x = mouseCoords.x;
                imageInfoViewer.selectionRegionInfo.y = mouseCoords.y;
                imageInfoViewer.selectionRegionInfo.width = 0;
                imageInfoViewer.selectionRegionInfo.height = 0;
            }
        });
    }

    // setImageInfo
    // NOTE: This is async function
    setImageInfo(imageInfo) {
        // check for null
        if (imageInfo === null) {
            this.imageInfo = null;
            this.imageBuffer = null;
            this.clear();
            return;
        }

        // check for same image info
        if (this.imageInfo === imageInfo)
            return;

        // setup new image info
        if (this.imageInfo != imageInfo) {
            this.imageInfo = imageInfo;
            this.updateImageBuffer();
            //this.drawImageBuffer();
            //this.drawImageRegions();
        }
    }

    // setColorMapType
    // NOTE: This is async function
    setColorMapType(colorMapType) {
        if (this.colorMapType !== colorMapType) {
            this.colorMapType = colorMapType;
            this.updateImageBuffer();
            //this.drawImageBuffer();
            //this.drawImageRegions();
        }
    }

    // updateImageCache
    // NOTE: This is async function
    updateImageBuffer() {
        // check for null
        if (this.imageInfo === null)
            return;

        // calculate image buffer - gray scale 
        if (this.colorMapType == ColorMapTypeEnum.GRAY_SCALE) {
            // create canvas
            var canvas = document.createElement('canvas');
            canvas.width = this.imageInfo.image.width;
            canvas.height = this.imageInfo.image.height;

            // get context and draw original image
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.imageInfo.image, 0, 0);

            // copy img
            this.imageBuffer.onload = function (event) { event.currentTarget.imageInfoViewer.redraw(); };
            this.imageBuffer.src = canvas.toDataURL("image/png");
        }

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT) {
            // create canvas
            var canvas = document.createElement('canvas');
            canvas.width = this.imageInfo.image.width;
            canvas.height = this.imageInfo.image.height;

            // get context and draw original image
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.imageInfo.image, 0, 0);

            // get image data
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // update image data
            for (var i = 0; i < imageData.data.length; i += 4) {
                var color = grayscaleToJit(imageData.data[i + 1]); // get green value
                imageData.data[i + 0] = color.r * 255;
                imageData.data[i + 1] = color.g * 255;
                imageData.data[i + 2] = color.b * 255;
                imageData.data[i + 3] = 255;
            }

            // update context
            ctx.putImageData(imageData, 0, 0);
            console.log(imageData);

            // copy img
            this.imageBuffer.onload = function (event) { event.currentTarget.imageInfoViewer.redraw(); };
            this.imageBuffer.src = canvas.toDataURL("image/png");
        }
    }

    // drawImageBuffer
    drawImageBuffer() {
        // draw base image
        if (this.imageBuffer !== null) {
            this.imageCanvas.width = this.imageBuffer.width;
            this.imageCanvas.height = this.imageBuffer.height;
            this.imageCanvasCtx.drawImage(this.imageBuffer, 0, 0);
        }
    }

    // drawImageRegions
    drawImageRegions() {
        if (this.imageInfo !== null) {
            for (var i = 0; i < this.imageInfo.regions.length; i++) {
                var region = this.imageInfo.regions[i];
                this.imageCanvasCtx.globalAlpha = 0.8;
                this.imageCanvasCtx.fillStyle = region.color;
                this.imageCanvasCtx.fillRect(region.x, region.y, region.width, region.height);
                this.imageCanvasCtx.globalAlpha = 1.0;
            }
        }
    }

    // drawImageRegions
    drawSelectionRegion() {
        if (this.selectionStarted) {
            this.imageCanvasCtx.globalAlpha = 0.85;
            this.imageCanvasCtx.fillStyle = this.selectionRegionInfo.color;
            this.imageCanvasCtx.fillRect(this.selectionRegionInfo.x, this.selectionRegionInfo.y, this.selectionRegionInfo.width, this.selectionRegionInfo.height);
            this.imageCanvasCtx.globalAlpha = 1.0;
        }
    }

    // update
    redraw() {
        this.drawImageBuffer();
        this.drawImageRegions();
    }

    // clear
    clear() {
        this.imageCanvas.width = 300;
        this.imageCanvas.height = 150;
        this.imageCanvasCtx.rect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
    }
}

// ImageRegionViewer
class ImageRegionListViewer {
    constructor() {
        this.imageInfo = null;
        // get controls
        this.regionListContainer = document.getElementById("region_preview");
    }

    // setImageInfo
    setImageInfo(imageInfo) {
        // check for same image info
        if (this.imageInfo === imageInfo) {
            return;
        }

        // setup new image info
        if (this.imageInfo != imageInfo) {
            this.imageInfo = imageInfo;
            this.drawRegionList();
        }
    }

    // clear
    clear() {
        // clear childs
        while (this.regionListContainer.firstChild) {
            this.regionListContainer.removeChild(
                this.regionListContainer.firstChild
            );
        }
    }

    // drawRegions
    drawRegionList() {
        // clear data
        clear();

        // check for null
        if (this.imageInfo === null)
            return;

        // TODO: JUST DRAW region list (as internal canvases)
    }
}

// global classes
var gImageInfoList = [];
var gImageInfoListView = new ImageInfoListView(gImageInfoList);
var gImageInfoViewer = new ImageInfoViewer(center_panel);
var gImageRegionListViewer = new ImageRegionListViewer();

//--------------------------------------------------------------------------
// events
//--------------------------------------------------------------------------

// color map type click
function colorMapTypeClick() {
    if (document.getElementById("rbGrayScale").checked) {
        gImageInfoViewer.setColorMapType(ColorMapTypeEnum.GRAY_SCALE);
    } else {
        gImageInfoViewer.setColorMapType(ColorMapTypeEnum.JIT);
    }
}

// load images button event
function loadImageBtnClick() {
    if (invisible_file_input) {
        invisible_file_input.accept = '.jpg,.jpeg,.png,.bmp';
        invisible_file_input.onchange = function (event) {
            for (var i = 0; i < event.currentTarget.files.length; i++) {
                // create image info
                var imageInfo = new ImageInfo();
                imageInfo.fileRef = event.currentTarget.files[i];
                imageInfo.loadFromFile();
                // add image info
                gImageInfoList.push(imageInfo);
            }
            gImageInfoListView.update();
            imageInfoRegionsSelectorUpdate();
        }
        invisible_file_input.click();
    }
}

// image info list item click
function imageInfoListItemClick(event) {
    gImageInfoViewer.setImageInfo(event.currentTarget.imageInfo);
}

//--------------------------------------------------------------------------
// utils
//--------------------------------------------------------------------------

// imageInfoRegionsSelectorUpdate
function imageInfoRegionsSelectorUpdate() {
    if (imageInfoRegionsSelector) {
        // store selected value
        var selectedValue = imageInfoRegionsSelector.value;
        // clear childs
        while (imageInfoRegionsSelector.firstChild) {
            imageInfoRegionsSelector.removeChild(
                imageInfoRegionsSelector.firstChild
            );
        }
        // add items
        for (var i = 0; i < gImageInfoList.length; i++) {
            // create new selector
            var imageInfoRegionsOption = document.createElement('option');
            imageInfoRegionsOption.value = gImageInfoList[i].fileRef;
            imageInfoRegionsOption.innerHTML = gImageInfoList[i].fileRef.name;
            imageInfoRegionsSelector.appendChild(imageInfoRegionsOption);
        }
        // set selected value
        imageInfoRegionsSelector.value = selectedValue;
    }
}

// gray scale to JIT
function grayscaleToJit(value) {
    var t = ((value - 127.0) / 255.0) * 2.0;
    var result = {};
    result.r = clamp(1.5 - Math.abs(2.0 * t - 1.0), 0, 1);
    result.g = clamp(1.5 - Math.abs(2.0 * t), 0, 1);
    result.b = clamp(1.5 - Math.abs(2.0 * t + 1.0), 0, 1);
    return result;
}

// clamp, just clamp
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// get mause position for element
function getMousePosByElement(node, event) {
    var rect = node.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

// generate random color
function generateRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}