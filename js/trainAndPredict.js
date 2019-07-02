// global classes
var gTrainAndPredictView = new EmbeddingView("trainAndPredictRenderArea");
gTrainAndPredictView.renderer.domElement.addEventListener('mousedown', onMouseDownTrainAndPredict, false);

// train group
var gTrainGroup = new THREE.Group();
gTrainAndPredictView.scene.add(gTrainGroup);

// predict group
var gPredictGroupList = []; //new THREE.Group();
var gPredictGroupListCurrentIndex = 0;
//gTrainAndPredictView.scene.add(gPredictGroup);

// train containers
var gTrainInfoListArray = [];//new EmbeddedInfoList();
var gTrainInfoListCurrentIndex = 0;
var gTrainImagesLoaded = new Set(); // set of file names (strings)

// train containers
var gPredictInfoListArray = []; // new EmbeddedInfoList();
var gPredictInfoListCurrentIndex = 0;
var gPredictImagesLoaded = new Set(); // set of file names (strings)

// sets
var gPredictInfoChangedSet = new Set();

//--------------------------------------------------------------------------
// rendering
//--------------------------------------------------------------------------

// renderTrainAndPredict
var renderTrainAndPredict = function () {
    gTrainAndPredictView.render();
    requestAnimationFrame(renderTrainAndPredict);
};
renderTrainAndPredict();

// onMouseMoveTrainAndPredict
function onMouseDownTrainAndPredict(event) {
    predictGroup = gPredictGroupList[gPredictGroupListCurrentIndex];
    trainInfoList = gTrainInfoListArray[gTrainInfoListCurrentIndex];
    if (!predictGroup) return;
    if (!trainInfoList) return;
    if (!predictGroup.visible) return;
    if (!checkboxPredictEditable.checked) return;
    // ray caster
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    // set mouse position
    mouse.x = +(event.layerX / event.target.clientWidth) * 2 - 1;
    mouse.y = -(event.layerY / event.target.clientHeight) * 2 + 1;

    // ray cast
    raycaster.setFromCamera(mouse, gTrainAndPredictView.camera);
    var intersects = raycaster.intersectObjects(predictGroup.children);
    for (var i = 0; i < intersects.length; i++) {
        if (selectPredictType.value >= 0) {
            var color = trainInfoList.getColorByType(selectPredictType.value);
            intersects[i].object.material.color = new THREE.Color(color.r, color.g, color.b);
            intersects[i].object.embeddedInfo.type = selectPredictType.value;
            gPredictInfoChangedSet.add(intersects[i].object.embeddedInfo);
        } else {
            intersects[i].object.material.color = new THREE.Color(1, 1, 1);
            intersects[i].object.embeddedInfo.type = selectPredictType.value;
            gPredictInfoChangedSet.delete(intersects[i].object.embeddedInfo);
        }
    }
}


// updateEmbeddedRenderArea
function updateTrainAndPredictRenderArea() {
    gTrainAndPredictView.updateRenderArea();
    renderTrainAndPredict();
}

//--------------------------------------------------------------------------
// utils and events
//--------------------------------------------------------------------------

// train

// loadTrainImageBtnClick
function loadTrainImageBtnClick(event) {
    invisible_train_images_input.accept = '.jpg,.jpeg,.png,.bmp';
    invisible_train_images_input.onchange = function (event) {
        for (var i = 0; i < event.currentTarget.files.length; i++) {
            if (!gTrainImagesLoaded.has(event.currentTarget.files[i].name)) {
                gTrainImagesLoaded.add(event.currentTarget.files[i].name);

                // load image from file
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                    var image = new Image();
                    image.onload = function (event) {
                        var trainInfoList = gTrainInfoListArray[gTrainInfoListCurrentIndex];
                        var embeddedInfo = trainInfoList.getEmbeddedInfoByName(event.currentTarget.fileName);
                        // check embedded info exists
                        if (embeddedInfo) {
                            var texture = new THREE.Texture(this);
                            texture.needsUpdate = true;

                            // get color
                            var embeddedColor = trainInfoList.getColorByType(embeddedInfo.type);

                            // create sprite
                            var spriteMaterial = new THREE.SpriteMaterial({ map: texture, color: new THREE.Color(embeddedColor.r, embeddedColor.g, embeddedColor.b) });
                            var sprite = new THREE.Sprite(spriteMaterial);
                            sprite.embeddedInfo = embeddedInfo;
                            sprite.position.set(
                                embeddedInfo.x * 5,
                                embeddedInfo.y * 5,
                                embeddedInfo.z * 5);
                            var scale = trainAndPredictScale.value/trainAndPredictScale.max
                            sprite.scale.set(scale, scale, scale);
                            gTrainGroup.add(sprite);
                        }
                    };
                    //console.log(event.currentTarget.__fileName);
                    image.fileName = event.currentTarget.fileName;
                    image.src = event.currentTarget.result;
                }
                fileReader.fileName = event.currentTarget.files[i].name;
                fileReader.readAsDataURL(event.currentTarget.files[i]);
            }
        }
    }
    invisible_train_images_input.click();
}

//  loadTrainInfoBtnClick
function loadTrainInfoBtnClick(event) {
    invisible_train_info_file_input.accept = '.csv';
    invisible_train_info_file_input.onchange = function (event) {
        for (var i = 0; i < event.currentTarget.files.length; i++) {
            trainInfoList = new EmbeddedInfoList();
            trainInfoList.loadFromFile(event.currentTarget.files[i], selectPredictTypeUpdate);
            gTrainInfoListArray.push(trainInfoList);
        }

        sourceIndexPredictTb.max = Math.max(gTrainInfoListArray.length - 1, sourceIndexPredictTb.max);
    }
    invisible_train_info_file_input.click();
}

// predict

// loadPredictImageBtnClick
function loadPredictImageBtnClick(event) {
    invisible_predict_images_input.accept = '.jpg,.jpeg,.png,.bmp';
    invisible_predict_images_input.onchange = function (event) {
        var predictGroup = new THREE.Group();
        predictGroup.visible = false;

        for (var i = 0; i < event.currentTarget.files.length; i++) {
            if (!gPredictImagesLoaded.has(event.currentTarget.files[i].name)) {
                gPredictImagesLoaded.add(event.currentTarget.files[i].name);

                // load image from file
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                    var image = new Image();
                    image.onload = function (event) {
                        var predictInfoList = gPredictInfoListArray[gPredictInfoListCurrentIndex];
                        var embeddedInfo = predictInfoList.getEmbeddedInfoByName(event.currentTarget.fileName);
                        // check embedded info exists
                        if (embeddedInfo) {
                            var texture = new THREE.Texture(this);
                            texture.needsUpdate = true;

                            // create sprite
                            var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                            var sprite = new THREE.Sprite(spriteMaterial);
                            sprite.embeddedInfo = embeddedInfo;
                            sprite.position.set(
                                embeddedInfo.x * 5,
                                embeddedInfo.y * 5,
                                embeddedInfo.z * 5);
                            var scale = trainAndPredictScale.value/trainAndPredictScale.max
                            sprite.scale.set(scale, scale, scale);
                            this.predictGroup.add(sprite);
                        }
                    };
                    //console.log(event.currentTarget.__fileName);
                    image.fileName = event.currentTarget.fileName;
                    image.predictGroup = event.currentTarget.predictGroup;
                    image.src = event.currentTarget.result;
                }
                fileReader.fileName = event.currentTarget.files[i].name;
                fileReader.predictGroup = predictGroup;
                fileReader.readAsDataURL(event.currentTarget.files[i]);
            }
        }
        // show first group
        if (gPredictGroupList.length === 0)
            predictGroup.visible = true;

        // add new group to list
        gPredictGroupList.push(predictGroup);
        gTrainAndPredictView.scene.add(predictGroup);
    }
    invisible_predict_images_input.click();
}

//  loadPredictInfoBtnClick
function loadPredictInfoBtnClick(event) {
    invisible_predict_info_file_input.accept = '.csv';
    invisible_predict_info_file_input.onchange = function (event) {
        for (var i = 0; i < event.currentTarget.files.length; i++) {
            // create and add predictInfoList
            var predictInfoList = new EmbeddedInfoList()
            predictInfoList.loadFromFile(event.currentTarget.files[i]);
            gPredictInfoListArray.push(predictInfoList);

            // update GUI
            sourceIndexPredictTb.max = Math.max(gPredictInfoListArray.length - 1, sourceIndexPredictTb.max);
        }
    }
    invisible_predict_info_file_input.click();
}

// savePredictInfoBtnClick
function savePredictInfoBtnClick(event) {
    var embeddedString = '';

    // get changes predict infos
    gPredictInfoChangedSet.forEach(embeddedInfo => {
        embeddedString +=
            embeddedInfo.name + "," +
            embeddedInfo.type + "," + "\r\n";
    });

    // save changed predict infos
    if (embeddedString.length > 0)
        downloadFile(embeddedString, 'predict_emb_visualsignature.csv', 'text/plain');
}

// selectPredictTypeUpdate
function selectPredictTypeUpdate() {
    // get current trainInfoList
    var trainInfoList = gTrainInfoListArray[gTrainInfoListCurrentIndex];
    if (!trainInfoList) return;

    // get Set of types
    var setEmbeddedTypes = new Set();
    for (var i = 0; i < trainInfoList.embeddedInfos.length; i++)
        setEmbeddedTypes.add(trainInfoList.embeddedInfos[i].type);
    console.log(setEmbeddedTypes);

    // clear childs
    while (selectPredictType.firstChild) {
        selectPredictType.removeChild(
            selectPredictType.firstChild
        );
    }
    // add items
    setEmbeddedTypes.forEach(embeddedType => {
        // create new selector
        var optionEmbeddedType = document.createElement('option');
        optionEmbeddedType.value = embeddedType;
        var color = trainInfoList.getColorByType(optionEmbeddedType.value);
        var R = (color.r * 255);
        var G = (color.g * 255);
        var B = (color.b * 255);
        var str = "rgb(" + R + "," + G + "," + B + ")";
        optionEmbeddedType.style.background = str;
        optionEmbeddedType.innerText = "Type: " + embeddedType;
        selectPredictType.appendChild(optionEmbeddedType);
    });

    // create new selector
    var optionEmbeddedType = document.createElement('option');
    optionEmbeddedType.value = -1;
    optionEmbeddedType.innerText = "clear";
    selectPredictType.appendChild(optionEmbeddedType);
}

// updateTrainSpritesBySourceIndex
function updateTrainSpritesBySourceIndex(sourceIndex) {
    trainInfoList = gTrainInfoListArray[sourceIndex];
    if (!trainInfoList) return;
    gTrainGroup.children.forEach(sprite => {
        var embeddedInfo = trainInfoList.getEmbeddedInfoByName(sprite.embeddedInfo.name);
        sprite.embeddedInfo = embeddedInfo;
        sprite.position.set(
            embeddedInfo.x * 5,
            embeddedInfo.y * 5,
            embeddedInfo.z * 5);
    })
}

// updatePredictSpritesBySourceIndex
function updatePredictSpritesBySourceIndex(sourceIndex) {
    predictInfoList = gPredictInfoListArray[sourceIndex];
    if (!predictInfoList) return;
    gPredictGroupList.forEach(predictGroup => {
        predictGroup.children.forEach(sprite => {
            var embeddedInfo = predictInfoList.getEmbeddedInfoByName(sprite.embeddedInfo.name);
            sprite.embeddedInfo = embeddedInfo;
            sprite.position.set(
                embeddedInfo.x * 5,
                embeddedInfo.y * 5,
                embeddedInfo.z * 5);
        })
    });
}

// checkboxTrainVisibleOnChange
function checkboxTrainVisibleOnChange(event) {
    gTrainGroup.visible = checkboxTrainVisible.checked;
}

// checkboxTrainVisibleOnChange
function checkboxPredictVisibleOnChange(event) {
    gPredictGroupList.forEach(predictGroup => {
        predictGroup.visible = false;
    });
    gPredictGroupList[gPredictGroupListCurrentIndex].visible = checkboxPredictVisible.checked;
}

// onChangeSourceIndexPredictTb
function onChangeSourceIndexPredictTb(event) {
    gPredictInfoListCurrentIndex = parseInt(sourceIndexPredictTb.value);
    gTrainInfoListCurrentIndex = parseInt(sourceIndexPredictTb.value);
    resultIDPredict.innerText = gPredictInfoListCurrentIndex;
    updatePredictSpritesBySourceIndex(gPredictInfoListCurrentIndex);
    updateTrainSpritesBySourceIndex(gPredictInfoListCurrentIndex);
}

function onChangeTrainAndPredictScaleTb(event) {
    var scale = trainAndPredictScale.value/trainAndPredictScale.max;
    gTrainGroup.children.forEach(sprite => {
        sprite.scale.set(scale, scale, scale);
    });
    gPredictGroupList.forEach(predictGroup => {
        predictGroup.children.forEach(sprite => {
            sprite.scale.set(scale, scale, scale);
        })
    });
}

// prevBatchPredictBtnClick
function prevBatchPredictBtnClick(event) {
    gPredictGroupList[gPredictGroupListCurrentIndex].visible = false;
    gPredictGroupListCurrentIndex = Math.max(0, gPredictGroupListCurrentIndex - 1);
    gPredictGroupList[gPredictGroupListCurrentIndex].visible = checkboxPredictVisible.checked;
}

// nextBatchPredictBtnClick
function nextBatchPredictBtnClick(event) {
    gPredictGroupList[gPredictGroupListCurrentIndex].visible = false;
    gPredictGroupListCurrentIndex = Math.min(gPredictGroupList.length - 1, gPredictGroupListCurrentIndex + 1);
    gPredictGroupList[gPredictGroupListCurrentIndex].visible = checkboxPredictVisible.checked;
}