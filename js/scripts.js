// enums
var ColorMapTypeEnum = {
    GRAY_SCALE: 1,
    JIT: 2
};

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
}

// ImageListView
class ImageListView {
    constructor(imageList) {
        this.imageList = [];
        // get controls
        this.imageListContainer = document.getElementById("image_list_container");
    }

    // drawImageList
    drawImageList() {
        clear();

        // add new items
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

// ImageViewer
class ImageInfoViewer {
    constructor() {
        this.imageInfo = null; // current raw image info
        this.imageBuffer = null; // colored image buffer
        this.colorMapType = ColorMapTypeEnum.GRAY_SCALE;
        // get controls
        this.imageCanvas = document.getElementById("image_canvas");
    };

    // setImageInfo
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
            this.drawImageBuffer();
        }
    }

    // setColorMapType
    setColorMapType(colorMapType) {
        this.colorMapType = colorMapType;
        this.updateImageBuffer();
        this.drawImageBuffer();
        this.drawImageRegions();
    }

    // updateImageCache
    updateImageBuffer() {
        // exit if null
        if (imageInfo === null)
            return;

        // calculate image buffer - gray scale 
        if (this.colorMapType == ColorMapTypeEnum.GRAY_SCALE) {
            // just copy form image info
        }

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT) {
            // apply JIT
        }
    }

    // drawImageBuffer
    drawImageBuffer() {
        // TODO: JUST DRAW IMAGE BUFFER WITH SCALE
    }

    // drawImageRegions
    drawImageRegions() {
        // TODO: JUST DRAW REGIONS WITH SCALE
    }


    // clear
    clear() {
        // TODO: JUST DRAW EMPTY CANVAS
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

        // exit if null
        if (this.imageInfo === null)
            return;

        // TODO: JUST DRAW region list (as internal canvases)
    }
}

// global classes
var gImageListView = new ImageListView();
var gImageInfoViewer = new ImageInfoViewer();
var gImageRegionListViewer = new ImageRegionListViewer();

// utils