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

// TextureID
class TextureID {
    constructor(ID, color = "red") {
        this.ID = ID;
        this.color = color;
        this.name = "";
    }
}

// RegionInfo
class RegionInfo {
    constructor() {
        this.color = "red";
        this.ID = "";
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }

    // normalize region
    normalize() {
        // horizontal normilize
        if (this.width < 0) {
            this.x += this.width;
            this.width = -this.width;
        }

        // vertical normilize
        if (this.height < 0) {
            this.y += this.height;
            this.height = -this.height;
        }
    }

    // scale region parameters
    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        this.width *= factor;
        this.height *= factor;
    }

    // check intersection (regions MUST be normalized)
    checkIntersectionRegion(region) {
        return this.checkIntersection(region.x, region.y, region.width, region.height);
    }

    // check intersection (regions MUST be normalized)
    checkIntersection(x, y, w, h) {
        if ((this.x <= x + w) && (this.x + this.width >= x) &&
            (this.y <= y + h) && (this.y + this.height >= y)) {
            return true;
        } else {
            return false;
        }
    }

    // trim (regions MUST be normalized)
    trim(x0, y0, x1, y1) {
        // calc resulting coords
        var result_x0 = Math.max(x0, this.x);
        var result_y0 = Math.max(y0, this.y);
        var result_x1 = Math.min(x1, this.x + this.width - 1);
        var result_y1 = Math.min(y1, this.y + this.height - 1);

        // update fields
        this.x = result_x0;
        this.y = result_y0;
        this.width = result_x1 - result_x0;
        this.height = result_y1 - result_y0;
    }
}

// ImageInfo
class ImageInfo {
    constructor() {
        this.fileRef = null;
        this.image = null;
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

// TextureIDListView
class TextureIDListView {
    constructor(textureIDList) {
        this.textureIDList = textureIDList;
        this.onchange = null;
        // get controls
        this.textureIDListContainer = document.getElementById("texture_id_list_container");
    }

    // drawImageList
    update() {
        // get checked textureID
        var textureID = this.findCheckedTextureID();

        // just clear
        this.clear();

        // add new items
        for (var i = 0; i < this.textureIDList.length; i++)
            this.addTextureIDItem(this.textureIDList[i]);

        // check first textureID not cheked
        if (textureID) {
            this.checkByTextureID(textureID);
        }
        else if ((!textureID) && (this.textureIDList.length > 0))
            document.getElementsByName('textureID')[0].checked = true;
    }

    // find checked texture ID
    checkByTextureID(textureID) {
        if (textureID) {
            var radios = document.getElementsByName('textureID');
            for (var i = 0, length = radios.length; i < length; i++) {
                if (radios[i].textureID == textureID) {
                    radios[i].checked = true;
                    return;
                }
            }
        }
    }

    // find checked texture ID
    findCheckedTextureID() {
        var radios = document.getElementsByName('textureID');
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                return radios[i].textureID;
            }
        }
        return null;
    }

    // addItemInfoListItem
    addTextureIDItem(textureID) {
        if (textureID !== null) {
            var div = document.createElement("div");
            div.style = "display: flex; flex-direction: row";
            // create new radio button
            var radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "textureID";
            radio.textureID = textureID;
            radio.onchange = textureIDSelected;
            radio.style.background = textureID.color;
            div.appendChild(radio);
            // create ID label
            var item = document.createElement("a");
            item.innerText = textureID.ID;
            item.style.background = textureID.color;
            item.style.minWidth = "15px";
            item.style.fontWeight = "bold";
            div.appendChild(item);
            // create name
            var name = document.createElement("a");
            name.innerText = "Name:";
            div.appendChild(name);
            // create descr
            var descr = document.createElement("input");
            descr.type = "text";
            descr.text = textureID.descr;
            descr.style.width = "100%";
            descr.textureID = textureID;
            descr.oninput = function (event) {
                event.target.textureID.name = event.target.value;
                imageInfoRegionsSelectorUpdate();
            }
            div.appendChild(descr);
            // append to list
            this.textureIDListContainer.appendChild(div);
            return radio;
        }
        return null;
    }

    // clear
    clear() {
        // clear childs
        while (this.textureIDListContainer.firstChild) {
            this.textureIDListContainer.removeChild(
                this.textureIDListContainer.firstChild
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
        this.scale = 1.0;
        this.selectionStarted = false;
        this.selectionMode = SelectionModeEnum.ADD;
        this.selectionRegionInfo = new RegionInfo();
        this.onchange = null;
        this.textureID = null;

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

            // update selection region info
            if (imageInfoViewer.selectionStarted) {
                var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);
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

            // proceed selection
            if (imageInfoViewer.selectionStarted) {
                var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);

                // celection region normalize and scale
                imageInfoViewer.selectionRegionInfo.normalize();
                imageInfoViewer.selectionRegionInfo.scale(1.0 / imageInfoViewer.scale);

                // add regions from list
                if (imageInfoViewer.selectionMode === SelectionModeEnum.ADD) {
                    if (imageInfoViewer.isRegionInfoInside(imageInfoViewer.selectionRegionInfo)) {
                        // add new region info 
                        var regionInfo = new RegionInfo();
                        regionInfo.color = imageInfoViewer.selectionRegionInfo.color;
                        regionInfo.ID = imageInfoViewer.selectionRegionInfo.ID;
                        regionInfo.x = imageInfoViewer.selectionRegionInfo.x;
                        regionInfo.y = imageInfoViewer.selectionRegionInfo.y;
                        regionInfo.width = imageInfoViewer.selectionRegionInfo.width;
                        regionInfo.height = imageInfoViewer.selectionRegionInfo.height;
                        regionInfo.trim(0, 0, imageInfoViewer.imageBuffer.width, imageInfoViewer.imageBuffer.height);
                        imageInfoViewer.imageInfo.regions.push(regionInfo);
                    }
                } else if (imageInfoViewer.selectionMode === SelectionModeEnum.REMOVE) {
                    // remove regions from list
                    imageInfoViewer.removeRegionsInArea(imageInfoViewer.selectionRegionInfo);
                }

                // redraw all stuff
                imageInfoViewer.redraw();

                // call event
                if (imageInfoViewer.onchange)
                    imageInfoViewer.onchange(imageInfoViewer.imageInfo);
            }
            imageInfoViewer.selectionStarted = false;
        });
        // add event - mousedown
        this.parent.addEventListener("mousedown", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;

            // set selection state and setup selection region
            if (imageInfoViewer.imageInfo !== null) {
                var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);
                imageInfoViewer.selectionStarted = true;
                // check selection mode and set color
                if (imageInfoViewer.selectionMode === SelectionModeEnum.ADD) {
                    imageInfoViewer.selectionRegionInfo.color = imageInfoViewer.textureID.color;
                    imageInfoViewer.selectionRegionInfo.ID = imageInfoViewer.textureID.ID;
                } else if (imageInfoViewer.selectionMode === SelectionModeEnum.REMOVE) {
                    imageInfoViewer.selectionRegionInfo.color = "#FF0000";
                }
                // set base coords
                imageInfoViewer.selectionRegionInfo.x = mouseCoords.x;
                imageInfoViewer.selectionRegionInfo.y = mouseCoords.y;
                imageInfoViewer.selectionRegionInfo.width = 0;
                imageInfoViewer.selectionRegionInfo.height = 0;
            }
        });
    }

    // is region info inside
    isRegionInfoInside(regionInfo) {
        if (this.imageBuffer) {
            return regionInfo.checkIntersection(0, 0, this.imageBuffer.width, this.imageBuffer.height);
        }
        return false;
    }

    // remove regions from list by other region
    removeRegionsInArea(area) {
        area.normalize();
        // this is temporary solution. There will be previews
        for (var i = this.imageInfo.regions.length - 1; i >= 0; i--) {
            var region = this.imageInfo.regions[i];
            var intersected = region.checkIntersectionRegion(this.selectionRegionInfo);
            if (intersected) {
                this.imageInfo.regions.splice(i, 1);
            }
        }
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

    setSelectionMode(selectionMode) {
        if (this.selectionMode !== selectionMode) {
            this.selectionMode = selectionMode;
        }
    }

    // set scale
    setScale(scale) {
        if (this.scale !== scale) {
            this.scale = scale;
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

        // create canvas
        var canvas = document.createElement('canvas');
        canvas.width = this.imageInfo.image.width;
        canvas.height = this.imageInfo.image.height;

        // get context and draw original image
        var ctx = canvas.getContext('2d');
        ctx.drawImage(this.imageInfo.image, 0, 0);

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT) {
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
        }

        // copy img
        this.imageBuffer.onload = function (event) { event.currentTarget.imageInfoViewer.redraw(); };
        this.imageBuffer.src = canvas.toDataURL("image/png");
    }

    // drawImageBuffer
    drawImageBuffer() {
        // draw base image
        if (this.imageBuffer !== null) {
            this.imageCanvas.width = this.imageBuffer.width * this.scale;
            this.imageCanvas.height = this.imageBuffer.height * this.scale;
            this.imageCanvasCtx.drawImage(this.imageBuffer, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
        }
    }

    // drawImageRegions
    drawImageRegions() {
        if (this.imageInfo !== null) {
            for (var i = 0; i < this.imageInfo.regions.length; i++) {
                var region = this.imageInfo.regions[i];
                this.imageCanvasCtx.globalAlpha = 0.5;
                this.imageCanvasCtx.fillStyle = region.color;
                this.imageCanvasCtx.fillRect(region.x * this.scale, region.y * this.scale, region.width * this.scale, region.height * this.scale);
                this.imageCanvasCtx.globalAlpha = 1.0;
            }
        }
    }

    // drawImageRegions
    drawSelectionRegion() {
        if (this.selectionStarted) {
            // check selection mode and set alpha
            if (this.selectionMode === SelectionModeEnum.ADD) {
                this.imageCanvasCtx.globalAlpha = 0.8;
            } else if (this.selectionMode === SelectionModeEnum.REMOVE) {
                this.imageCanvasCtx.globalAlpha = 0.85;
            }
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
class ImageRegionViewer {
    constructor(imageInfoList) {
        this.imageInfoList = imageInfoList;
        this.textureID = null;
        this.colorMapType = ColorMapTypeEnum.GRAY_SCALE;
        // get controls
        this.regionListContainer = document.getElementById("region_preview");
    }

    // setTextureID
    setTextureID(textureID) {
        // check for same image info
        if (this.textureID === textureID) {
            return;
        }

        // setup new image info
        if (this.textureID != textureID) {
            this.textureID = textureID;
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

    // setColorMapType
    // NOTE: This is async function
    setColorMapType(colorMapType) {
        if (this.colorMapType !== colorMapType) {
            this.colorMapType = colorMapType;
            this.drawRegionList();
        }
    }

    // drawRegions
    drawRegionList() {
        // clear data
        this.clear();

        // check for null
        if (this.textureID === null)
            return;

        // this is temporary solution. There will be previews
        for (var i = 0; i < this.imageInfoList.length; i++) {
            // get image info
            var imageInfo = this.imageInfoList[i];
            for (var j = 0; j < imageInfo.regions.length; j++) {
                // get region info
                var regionInfo = imageInfo.regions[j];
                if (regionInfo.ID === this.textureID.ID) {
                    this.appendRegionInfoItem(imageInfo, regionInfo)
                }
            }
        }
        // TODO: JUST DRAW region list (as internal canvases)
    }

    // addRegionInfoItem
    appendRegionInfoItem(imageInfo, regionInfo) {
        // get ratio
        var ratio = regionInfo.width/regionInfo.height;
        var canvas_width = Math.min(regionInfo.width, 250);
        var canvas_height = canvas_width/ratio;
        // create canvas
        var canvas = document.createElement('canvas');
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        canvas.style.maxWidth = canvas_width;
        canvas.style.maxHeight = canvas_height;
        canvas.style.padding = "5px";

        // get context and draw original image
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imageInfo.image,
            regionInfo.x, regionInfo.y,
            regionInfo.width, regionInfo.height,
            0, 0,
            canvas.width, canvas.height
        );

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT) {
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
        }

        // add label
        var label = document.createElement('a');
        label.innerText = imageInfo.fileRef.name;
        this.regionListContainer.appendChild(label);

        // append new canvas
        this.regionListContainer.appendChild(canvas);

        // create break
        this.regionListContainer.appendChild(
            document.createElement('br')
        );
        
    }
}

// color table for color IDs
var cColorTable = [
    "blue",
    "red",
    "green",
    "orange",
    "#006666",
];

// global classes
var gImageInfoList = [];
var gTextureIDList = [
    new TextureID("A", cColorTable[0]),
    new TextureID("B", cColorTable[1]),
    new TextureID("C", cColorTable[2]),
    new TextureID("D", cColorTable[3])
];

// global components
var gTextureIDListView = new TextureIDListView(gTextureIDList);
gTextureIDListView.update();
var gImageInfoViewer = new ImageInfoViewer(image_canvas_panel);
gImageInfoViewer.textureID = gTextureIDList[0];
gImageInfoViewer.onchange = imageInfoChange;
var gImageRegionListViewer = new ImageRegionViewer(gImageInfoList);
imageInfoRegionsSelectorUpdate();

//--------------------------------------------------------------------------
// events
//--------------------------------------------------------------------------

// setection mode click
function setectionModeClick() {
    if (document.getElementById("rbSetectionModeAdd").checked) {
        gImageInfoViewer.setSelectionMode(SelectionModeEnum.ADD);
    } else {
        gImageInfoViewer.setSelectionMode(SelectionModeEnum.REMOVE);
    }
}

// color map type click
function colorMapTypeClick() {
    if (document.getElementById("rbGrayScale").checked) {
        gImageInfoViewer.setColorMapType(ColorMapTypeEnum.GRAY_SCALE);
        gImageRegionListViewer.setColorMapType(ColorMapTypeEnum.GRAY_SCALE);
    } else {
        gImageInfoViewer.setColorMapType(ColorMapTypeEnum.JIT);
        gImageRegionListViewer.setColorMapType(ColorMapTypeEnum.JIT);
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
            imageInfoRegionsSelectorUpdate();
            selectImageNumberUpdate();
            // image number input
            //if (gImageInfoList.length > 0)
            //    imageNumberInput.max = gImageInfoList.length - 1;
        }
        invisible_file_input.click();
    }
}

// image info list item click
function imageInfoListItemClick(event) {
    gImageInfoViewer.setImageInfo(event.currentTarget.imageInfo);
}

// image info list item click
function imageInfoChange(imageInfo) {
    gImageRegionListViewer.drawRegionList();
}

// scale down bnt click
function scaleDownBntClick(event) {
    gImageInfoViewer.setScale(gImageInfoViewer.scale / 2);
    scaleFactor.innerText = Math.round(gImageInfoViewer.scale * 100) + "%";
}

// scale up bnt click
function scaleUpBtnClick(event) {
    gImageInfoViewer.setScale(gImageInfoViewer.scale * 2);
    scaleFactor.innerText = Math.round(gImageInfoViewer.scale * 100) + "%";
}

// // image number input change
// function imageNumberInputChange(event) {
//     gImageInfoViewer.setImageInfo(gImageInfoList[imageNumberInput.value]);
// }

function selectImageNumberChange(event) {
    gImageInfoViewer.setImageInfo(gImageInfoList[selectImageNumber.selectedIndex]);
}

// image info regions selector change
function imageInfoRegionsSelectorChange(event) {
    gImageRegionListViewer.setTextureID(gTextureIDList[imageInfoRegionsSelector.selectedIndex]);
}

// add texture ID button click
function addTextureIDButtonClick(event) {
    var id = nextChar(gTextureIDList[gTextureIDList.length - 1].ID);
    var color = generateRandomColor();
    gTextureIDList.push(new TextureID(id, color));
    gTextureIDListView.update();
    imageInfoRegionsSelectorUpdate();
}

// texture Is Selected
function textureIDSelected(event) {
    gImageInfoViewer.textureID = event.target.textureID;
}

// submit click
function  submitClick(event) {
    var regionsString = '';
    for (var i = 0; i < gImageInfoList.length; i++) {
        var imageInfo = gImageInfoList[i];
        for (var j = 0; j < imageInfo.regions.length; j++) {
            var imageRegion = imageInfo.regions[j];
            console.log(imageInfo.fileRef.mozFullPath);
            regionsString += 
                imageInfo.fileRef.name + ", " +
                imageRegion.x + ", " + 
                imageRegion.y + ", " + 
                "1, " + 
                (imageRegion.x + imageRegion.width) + ", " + 
                (imageRegion.y + imageRegion.height) + ", " + 
                "1, " + 
                imageRegion.ID + ", " +
                gTextureIDList.find(textureID => textureID.ID === imageRegion.ID).name + "\r\n";
            ;
        }
    }
    
    downloadFile(regionsString, 'regions.txt', 'text/plain');
}

//--------------------------------------------------------------------------
// utils
//--------------------------------------------------------------------------

// imageInfoRegionsSelectorUpdate
function imageInfoRegionsSelectorUpdate() {
    if (imageInfoRegionsSelector) {
        // store selected value
        var selectedIndex = imageInfoRegionsSelector.selectedIndex;
        // clear childs
        while (imageInfoRegionsSelector.firstChild) {
            imageInfoRegionsSelector.removeChild(
                imageInfoRegionsSelector.firstChild
            );
        }
        // add items
        for (var i = 0; i < gTextureIDList.length; i++) {
            // create new selector
            var textureIDOption = document.createElement('option');
            textureIDOption.value = gTextureIDList[i];
            textureIDOption.innerHTML = gTextureIDList[i].ID + ": " + gTextureIDList[i].name;
            imageInfoRegionsSelector.appendChild(textureIDOption);
        }
        // set selected value
        if ((selectedIndex < 0) && (gTextureIDList.length > 0)) {
            imageInfoRegionsSelector.value = gTextureIDList[0];
            gImageRegionListViewer.setTextureID(gTextureIDList[imageInfoRegionsSelector.selectedIndex])
        } else {
            imageInfoRegionsSelector.selectedIndex = selectedIndex;
        }
    }
}

// selectImageNumberUpdate
function selectImageNumberUpdate() {
    if (imageInfoRegionsSelector) {
        // get selected index
        var selectedIndex = selectImageNumber.selectedIndex;

        // clear childs
        while (selectImageNumber.firstChild) { selectImageNumber.removeChild(selectImageNumber.firstChild); }

        // add items
        for (var i = 0; i < gImageInfoList.length; i++) {
            // create new selector
            var imageIDOption = document.createElement('option');
            imageIDOption.value = gImageInfoList[i];
            imageIDOption.innerHTML = gImageInfoList[i].fileRef.name;
            selectImageNumber.appendChild(imageIDOption);
        }

        // set selected index
        selectImageNumber.selectedIndex = selectedIndex;
    }
}

function downloadFile(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
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

// next char
function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}
