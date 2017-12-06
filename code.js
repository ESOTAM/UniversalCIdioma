function Hashtable() {
    this.items = {}
}
Hashtable.prototype.put = function(key, value) {
    this.items[key] = value
};
Hashtable.prototype.get = function(key) {
    return this.items[key]
};
Hashtable.prototype.containsKey = function(key) {
    return this.items.hasOwnProperty(key)
};
Hashtable.prototype.remove = function(key) {
    delete this.items[key]
};
Hashtable.prototype.firstKey = function() {
    for (var k in this.items) {
        if (this.items.hasOwnProperty(k)) {
            return k
        }
    }
    return undefined
};
Hashtable.prototype.keys = function(result) {
    result.length = 0;
    for (var k in this.items) {
        if (this.items.hasOwnProperty(k)) {
            result.push(k)
        }
    }
};
Hashtable.prototype.values = function(result) {
    result.length = 0;
    for (var k in this.items) {
        if (this.items.hasOwnProperty(k)) {
            result.push(this.items[k])
        }
    }
};
Hashtable.prototype.clear = function() {
    for (var k in this.items) {
        if (this.items.hasOwnProperty(k)) {
            delete this.items[k]
        }
    }
};
var gdjs = gdjs || {
    objectsTypes: new Hashtable,
    behaviorsTypes: new Hashtable,
    evtTools: {},
    callbacksRuntimeSceneLoaded: [],
    callbacksRuntimeSceneUnloaded: [],
    callbacksObjectDeletedFromScene: []
};
gdjs.rgbToHex = function(r, g, b) {
    return "" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
};
gdjs.random = function(max) {
    if (max <= 0) return 0;
    return Math.floor(Math.random() * (max + 1))
};
gdjs.toRad = function(angleInDegrees) {
    return angleInDegrees / 180 * 3.14159
};
gdjs.toDegrees = function(angleInRadians) {
    return angleInRadians * 180 / 3.14159
};
gdjs.registerObjects = function() {
    gdjs.objectsTypes.clear();
    for (var p in this) {
        if (this.hasOwnProperty(p)) {
            if (gdjs[p].thisIsARuntimeObjectConstructor != undefined) {
                gdjs.objectsTypes.put(gdjs[p].thisIsARuntimeObjectConstructor, gdjs[p])
            }
        }
    }
};
gdjs.registerBehaviors = function() {
    gdjs.behaviorsTypes.clear();
    for (var p in this) {
        if (this.hasOwnProperty(p)) {
            if (gdjs[p].thisIsARuntimeBehaviorConstructor != undefined) {
                gdjs.behaviorsTypes.put(gdjs[p].thisIsARuntimeBehaviorConstructor, gdjs[p])
            }
        }
    }
};
gdjs.registerGlobalCallbacks = function() {
    gdjs.callbacksRuntimeSceneLoaded = [];
    gdjs.callbacksRuntimeSceneUnloaded = [];
    gdjs.callbacksObjectDeletedFromScene = [];
    var totalprop = 0;
    innerRegisterGlobalCallbacks = function(obj, nestLevel) {
        for (var p in obj) {
            if (obj.hasOwnProperty(p) && obj[p] !== null && Object.prototype.toString.call(obj[p]) !== "[object Array]" && typeof obj === "object") {
                totalprop++;
                if (obj[p].gdjsCallbackRuntimeSceneLoaded !== undefined) {
                    gdjs.callbacksRuntimeSceneLoaded.push(obj[p].gdjsCallbackRuntimeSceneLoaded)
                }
                if (obj[p].gdjsCallbackRuntimeSceneUnloaded !== undefined) {
                    gdjs.callbacksRuntimeSceneUnloaded.push(obj[p].gdjsCallbackRuntimeSceneUnloaded)
                }
                if (obj[p].gdjsCallbackObjectDeletedFromScene !== undefined) {
                    gdjs.callbacksObjectDeletedFromScene.push(obj[p].gdjsCallbackObjectDeletedFromScene)
                }
                if (nestLevel <= 1) innerRegisterGlobalCallbacks(obj[p], nestLevel + 1)
            }
        }
    };
    innerRegisterGlobalCallbacks(this, 0)
};
gdjs.getObjectConstructor = function(name) {
    if (name !== undefined && gdjs.objectsTypes.containsKey(name)) return gdjs.objectsTypes.get(name);
    console.warn('Object type "' + name + '" was not found.');
    return gdjs.objectsTypes.get("")
};
gdjs.getBehaviorConstructor = function(name) {
    if (name !== undefined && gdjs.behaviorsTypes.containsKey(name)) return gdjs.behaviorsTypes.get(name);
    console.warn('Behavior type "' + name + '" was not found.');
    return gdjs.behaviorsTypes.get("")
};
gdjs.staticArray = function(owner) {
    owner._staticArray = owner._staticArray || [];
    return owner._staticArray
};
gdjs.staticArray2 = function(owner) {
    owner._staticArray2 = owner._staticArray2 || [];
    return owner._staticArray2
};
Array.prototype.remove = function(from) {
    for (var i = from, len = this.length - 1; i < len; i++) this[i] = this[i + 1];
    this.length = len
};
Array.prototype.createFrom = function(arr) {
    var len = arr.length;
    for (var i = 0; i < len; ++i) {
        this[i] = arr[i]
    }
    this.length = len
};
console.warn = console.warn || console.log;
console.error = console.error || console.log;
gdjs.HSHG = gdjs.HSHG || {};
(function(root, undefined) {
    function update_RECOMPUTE() {
        var i, obj, grid, meta, objAABB, newObjHash;
        for (i = 0; i < this._globalObjects.length; i++) {
            obj = this._globalObjects[i];
            meta = obj.HSHG;
            grid = meta.grid;
            objAABB = obj.getAABB();
            newObjHash = grid.toHash(objAABB.min[0], objAABB.min[1]);
            if (newObjHash !== meta.hash) {
                grid.removeObject(obj);
                grid.addObject(obj, newObjHash)
            }
        }
    }

    function update_REMOVEALL() {}

    function testAABBOverlap(objA, objB) {
        var a = objA.getAABB(),
            b = objB.getAABB();
        if (a.min[0] > b.max[0] || a.min[1] > b.max[1] || a.max[0] < b.min[0] || a.max[1] < b.min[1]) {
            return false
        } else {
            return true
        }
    }

    function getLongestAABBEdge(min, max) {
        return Math.max(Math.abs(max[0] - min[0]), Math.abs(max[1] - min[1]))
    }

    function HSHG() {
        this.MAX_OBJECT_CELL_DENSITY = 1 / 8;
        this.INITIAL_GRID_LENGTH = 256;
        this.HIERARCHY_FACTOR = 2;
        this.HIERARCHY_FACTOR_SQRT = Math.SQRT2;
        this.UPDATE_METHOD = update_RECOMPUTE;
        this._grids = [];
        this._globalObjects = []
    }
    HSHG.prototype.addObject = function(obj) {
        var x, i, cellSize, objAABB = obj.getAABB(),
            objSize = getLongestAABBEdge(objAABB.min, objAABB.max),
            oneGrid, newGrid;
        obj.HSHG = {
            globalObjectsIndex: this._globalObjects.length
        };
        this._globalObjects.push(obj);
        if (this._grids.length === 0) {
            cellSize = objSize * this.HIERARCHY_FACTOR_SQRT;
            newGrid = new Grid(cellSize, this.INITIAL_GRID_LENGTH, this);
            newGrid.initCells();
            newGrid.addObject(obj);
            this._grids.push(newGrid)
        } else {
            x = 0;
            for (i = 0; i < this._grids.length; i++) {
                oneGrid = this._grids[i];
                x = oneGrid.cellSize;
                if (objSize < x) {
                    x = x / this.HIERARCHY_FACTOR;
                    if (objSize < x) {
                        while (objSize < x) {
                            x = x / this.HIERARCHY_FACTOR
                        }
                        newGrid = new Grid(x * this.HIERARCHY_FACTOR, this.INITIAL_GRID_LENGTH, this);
                        newGrid.initCells();
                        newGrid.addObject(obj);
                        this._grids.splice(i, 0, newGrid)
                    } else {
                        oneGrid.addObject(obj)
                    }
                    return
                }
            }
            while (objSize >= x) {
                x = x * this.HIERARCHY_FACTOR
            }
            newGrid = new Grid(x, this.INITIAL_GRID_LENGTH, this);
            newGrid.initCells();
            newGrid.addObject(obj);
            this._grids.push(newGrid)
        }
    };
    HSHG.prototype.removeObject = function(obj) {
        var meta = obj.HSHG,
            globalObjectsIndex, replacementObj;
        if (meta === undefined) {
            throw Error(obj + " was not in the HSHG.");
            return
        }
        globalObjectsIndex = meta.globalObjectsIndex;
        if (globalObjectsIndex === this._globalObjects.length - 1) {
            this._globalObjects.pop()
        } else {
            replacementObj = this._globalObjects.pop();
            replacementObj.HSHG.globalObjectsIndex = globalObjectsIndex;
            this._globalObjects[globalObjectsIndex] = replacementObj
        }
        meta.grid.removeObject(obj);
        delete obj.HSHG
    };
    HSHG.prototype.update = function() {
        this.UPDATE_METHOD.call(this)
    };
    HSHG.prototype.queryForCollisionWith = function(theObject, result) {
        var i, j, k, l, c, grid, cell, objA, objB, offset, adjacentCell, biggerGrid, objAAABB, objAHashInBiggerGrid;
        result.length = 0;
        theObject.HSHG.excludeMe = true;
        var theObjectAABB = theObject.getAABB();
        var theObjectHashInItsGrid = theObject.HSHG.grid.toHash(theObjectAABB.min[0], theObjectAABB.min[1]);
        var theObjectCellInItsGrid = theObject.HSHG.grid.allCells[theObjectHashInItsGrid];
        broadOverlapTest = testAABBOverlap;
        for (i = 0; i < this._grids.length; i++) {
            grid = this._grids[i];
            if (grid.cellSize === theObject.HSHG.grid.cellSize) {
                for (j = 0; j < grid.occupiedCells.length; j++) {
                    cell = grid.occupiedCells[j];
                    for (l = 0; l < cell.objectContainer.length; l++) {
                        objB = cell.objectContainer[l];
                        if (!objB.HSHG.excludeMe && broadOverlapTest(theObject, objB) === true) {
                            result.push(objB)
                        }
                    }
                    for (c = 0; c < 4; c++) {
                        offset = cell.neighborOffsetArray[c];
                        adjacentCell = grid.allCells[cell.allCellsIndex + offset];
                        for (l = 0; l < adjacentCell.objectContainer.length; l++) {
                            objB = adjacentCell.objectContainer[l];
                            if (!objB.HSHG.excludeMe && broadOverlapTest(theObject, objB) === true) {
                                result.push(objB)
                            }
                        }
                    }
                }
                for (k = i + 1; k < this._grids.length; k++) {
                    biggerGrid = this._grids[k];
                    var objectHashInBiggerGrid = biggerGrid.toHash(theObjectAABB.min[0], theObjectAABB.min[1]);
                    cell = biggerGrid.allCells[objectHashInBiggerGrid];
                    for (c = 0; c < cell.neighborOffsetArray.length; c++) {
                        offset = cell.neighborOffsetArray[c];
                        adjacentCell = biggerGrid.allCells[cell.allCellsIndex + offset];
                        for (l = 0; l < adjacentCell.objectContainer.length; l++) {
                            objB = adjacentCell.objectContainer[l];
                            if (broadOverlapTest(theObject, objB) === true) {
                                result.push(objB)
                            }
                        }
                    }
                }
                break
            } else if (grid.cellSize < theObject.HSHG.grid.cellSize) {
                for (j = 0; j < grid.allObjects.length; j++) {
                    objA = grid.allObjects[j];
                    objAAABB = objA.getAABB();
                    objAHashInBiggerGrid = theObject.HSHG.grid.toHash(objAAABB.min[0], objAAABB.min[1]);
                    var objAIsInAdjacentCellToObject = false;
                    for (c = 0; c < theObjectCellInItsGrid.neighborOffsetArray.length; c++) {
                        offset = theObjectCellInItsGrid.neighborOffsetArray[c];
                        if (objAHashInBiggerGrid === theObjectCellInItsGrid.allCellsIndex + offset) {
                            objAIsInAdjacentCellToObject = true;
                            break
                        }
                    }
                    if (objAIsInAdjacentCellToObject) {
                        if (broadOverlapTest(theObject, objA) === true) {
                            result.push(objA)
                        }
                    }
                }
            }
        }
        delete theObject.HSHG.excludeMe
    };
    HSHG.update_RECOMPUTE = update_RECOMPUTE;
    HSHG.update_REMOVEALL = update_REMOVEALL;

    function Grid(cellSize, cellCount, parentHierarchy) {
        this.cellSize = cellSize;
        this.inverseCellSize = 1 / cellSize;
        this.rowColumnCount = ~~Math.sqrt(cellCount);
        this.xyHashMask = this.rowColumnCount - 1;
        this.occupiedCells = [];
        this.allCells = Array(this.rowColumnCount * this.rowColumnCount);
        this.allObjects = [];
        this.sharedInnerOffsets = [];
        this._parentHierarchy = parentHierarchy || null
    }
    Grid.prototype.initCells = function() {
        var i, gridLength = this.allCells.length,
            x, y, wh = this.rowColumnCount,
            isOnRightEdge, isOnLeftEdge, isOnTopEdge, isOnBottomEdge, innerOffsets = [wh - 1, wh, wh + 1, -1, 0, 1, -1 + -wh, -wh, -wh + 1],
            leftOffset, rightOffset, topOffset, bottomOffset, uniqueOffsets = [],
            cell;
        this.sharedInnerOffsets = innerOffsets;
        for (i = 0; i < gridLength; i++) {
            cell = new Cell;
            y = ~~(i / this.rowColumnCount);
            x = ~~(i - y * this.rowColumnCount);
            isOnRightEdge = false;
            isOnLeftEdge = false;
            isOnTopEdge = false;
            isOnBottomEdge = false;
            if ((x + 1) % this.rowColumnCount == 0) {
                isOnRightEdge = true
            } else if (x % this.rowColumnCount == 0) {
                isOnLeftEdge = true
            }
            if ((y + 1) % this.rowColumnCount == 0) {
                isOnTopEdge = true
            } else if (y % this.rowColumnCount == 0) {
                isOnBottomEdge = true
            }
            if (isOnRightEdge || isOnLeftEdge || isOnTopEdge || isOnBottomEdge) {
                rightOffset = isOnRightEdge === true ? -wh + 1 : 1;
                leftOffset = isOnLeftEdge === true ? wh - 1 : -1;
                topOffset = isOnTopEdge === true ? -gridLength + wh : wh;
                bottomOffset = isOnBottomEdge === true ? gridLength - wh : -wh;
                uniqueOffsets = [leftOffset + topOffset, topOffset, rightOffset + topOffset, leftOffset, 0, rightOffset, leftOffset + bottomOffset, bottomOffset, rightOffset + bottomOffset];
                cell.neighborOffsetArray = uniqueOffsets
            } else {
                cell.neighborOffsetArray = this.sharedInnerOffsets
            }
            cell.allCellsIndex = i;
            this.allCells[i] = cell
        }
    };
    Grid.prototype.toHash = function(x, y, z) {
        var i, xHash, yHash, zHash;
        if (x < 0) {
            i = -x * this.inverseCellSize;
            xHash = this.rowColumnCount - 1 - (~~i & this.xyHashMask)
        } else {
            i = x * this.inverseCellSize;
            xHash = ~~i & this.xyHashMask
        }
        if (y < 0) {
            i = -y * this.inverseCellSize;
            yHash = this.rowColumnCount - 1 - (~~i & this.xyHashMask)
        } else {
            i = y * this.inverseCellSize;
            yHash = ~~i & this.xyHashMask
        }
        return xHash + yHash * this.rowColumnCount
    };
    Grid.prototype.addObject = function(obj, hash) {
        var objAABB, objHash, targetCell;
        if (hash !== undefined) {
            objHash = hash
        } else {
            objAABB = obj.getAABB();
            objHash = this.toHash(objAABB.min[0], objAABB.min[1])
        }
        targetCell = this.allCells[objHash];
        if (targetCell.objectContainer.length === 0) {
            targetCell.occupiedCellsIndex = this.occupiedCells.length;
            this.occupiedCells.push(targetCell)
        }
        obj.HSHG.objectContainerIndex = targetCell.objectContainer.length;
        obj.HSHG.hash = objHash;
        obj.HSHG.grid = this;
        obj.HSHG.allGridObjectsIndex = this.allObjects.length;
        targetCell.objectContainer.push(obj);
        this.allObjects.push(obj);
        if (this.allObjects.length / this.allCells.length > this._parentHierarchy.MAX_OBJECT_CELL_DENSITY) {
            this.expandGrid()
        }
    };
    Grid.prototype.removeObject = function(obj) {
        var meta = obj.HSHG,
            hash, containerIndex, allGridObjectsIndex, cell, replacementCell, replacementObj;
        hash = meta.hash;
        containerIndex = meta.objectContainerIndex;
        allGridObjectsIndex = meta.allGridObjectsIndex;
        cell = this.allCells[hash];
        if (cell.objectContainer.length === 1) {
            cell.objectContainer.length = 0;
            if (cell.occupiedCellsIndex === this.occupiedCells.length - 1) {
                this.occupiedCells.pop()
            } else {
                replacementCell = this.occupiedCells.pop();
                replacementCell.occupiedCellsIndex = cell.occupiedCellsIndex;
                this.occupiedCells[cell.occupiedCellsIndex] = replacementCell
            }
            cell.occupiedCellsIndex = null
        } else {
            if (containerIndex === cell.objectContainer.length - 1) {
                cell.objectContainer.pop()
            } else {
                replacementObj = cell.objectContainer.pop();
                replacementObj.HSHG.objectContainerIndex = containerIndex;
                cell.objectContainer[containerIndex] = replacementObj
            }
        }
        if (allGridObjectsIndex === this.allObjects.length - 1) {
            this.allObjects.pop()
        } else {
            replacementObj = this.allObjects.pop();
            replacementObj.HSHG.allGridObjectsIndex = allGridObjectsIndex;
            this.allObjects[allGridObjectsIndex] = replacementObj
        }
    };
    Grid.prototype.expandGrid = function() {
        var i, j, currentCellCount = this.allCells.length,
            currentRowColumnCount = this.rowColumnCount,
            currentXYHashMask = this.xyHashMask,
            newCellCount = currentCellCount * 4,
            newRowColumnCount = ~~Math.sqrt(newCellCount),
            newXYHashMask = newRowColumnCount - 1,
            allObjects = this.allObjects.slice(0),
            aCell, push = Array.prototype.push;
        for (i = 0; i < allObjects.length; i++) {
            this.removeObject(allObjects[i])
        }
        this.rowColumnCount = newRowColumnCount;
        this.allCells = Array(this.rowColumnCount * this.rowColumnCount);
        this.xyHashMask = newXYHashMask;
        this.initCells();
        for (i = 0; i < allObjects.length; i++) {
            this.addObject(allObjects[i])
        }
    };

    function Cell() {
        this.objectContainer = [];
        this.neighborOffsetArray;
        this.occupiedCellsIndex = null;
        this.allCellsIndex = null
    }
    root["HSHG"] = HSHG;
    HSHG._private = {
        Grid: Grid,
        Cell: Cell,
        testAABBOverlap: testAABBOverlap,
        getLongestAABBEdge: getLongestAABBEdge
    }
})(gdjs.HSHG);
gdjs.InputManager = function() {
    this._pressedKeys = new Hashtable;
    this._releasedKeys = new Hashtable;
    this._lastPressedKey = 0;
    this._pressedMouseButtons = new Array(5);
    this._releasedMouseButtons = new Array(5);
    this._mouseX = 0;
    this._mouseY = 0;
    this._mouseWheelDelta = 0;
    this._touches = new Hashtable;
    this._startedTouches = [];
    this._endedTouches = [];
    this._touchSimulateMouse = true
};
gdjs.InputManager.prototype.onKeyPressed = function(keyCode) {
    this._pressedKeys.put(keyCode, true);
    this._lastPressedKey = keyCode
};
gdjs.InputManager.prototype.onKeyReleased = function(keyCode) {
    this._pressedKeys.put(keyCode, false);
    this._releasedKeys.put(keyCode, true)
};
gdjs.InputManager.prototype.getLastPressedKey = function() {
    return this._lastPressedKey
};
gdjs.InputManager.prototype.isKeyPressed = function(keyCode) {
    return this._pressedKeys.containsKey(keyCode) && this._pressedKeys.get(keyCode)
};
gdjs.InputManager.prototype.wasKeyReleased = function(keyCode) {
    return this._releasedKeys.containsKey(keyCode) && this._releasedKeys.get(keyCode)
};
gdjs.InputManager.prototype.anyKeyPressed = function() {
    for (var keyCode in this._pressedKeys.items) {
        if (this._pressedKeys.items.hasOwnProperty(keyCode)) {
            if (this._pressedKeys.items[keyCode]) {
                return true
            }
        }
    }
    return false
};
gdjs.InputManager.prototype.onMouseMove = function(x, y) {
    this._mouseX = x;
    this._mouseY = y
};
gdjs.InputManager.prototype.getMouseX = function() {
    return this._mouseX
};
gdjs.InputManager.prototype.getMouseY = function() {
    return this._mouseY
};
gdjs.InputManager.prototype.onMouseButtonPressed = function(buttonCode) {
    this._pressedMouseButtons[buttonCode] = true;
    this._releasedMouseButtons[buttonCode] = false
};
gdjs.InputManager.prototype.onMouseButtonReleased = function(buttonCode) {
    this._pressedMouseButtons[buttonCode] = false;
    this._releasedMouseButtons[buttonCode] = true
};
gdjs.InputManager.prototype.isMouseButtonPressed = function(buttonCode) {
    return this._pressedMouseButtons[buttonCode] !== undefined && this._pressedMouseButtons[buttonCode]
};
gdjs.InputManager.prototype.isMouseButtonReleased = function(buttonCode) {
    return this._releasedMouseButtons[buttonCode] !== undefined && this._releasedMouseButtons[buttonCode]
};
gdjs.InputManager.prototype.onMouseWheel = function(wheelDelta) {
    this._mouseWheelDelta = wheelDelta
};
gdjs.InputManager.prototype.getMouseWheelDelta = function() {
    return this._mouseWheelDelta
};
gdjs.InputManager.prototype.getTouchX = function(identifier) {
    if (!this._touches.containsKey(identifier)) return 0;
    return this._touches.get(identifier).x
};
gdjs.InputManager.prototype.getTouchY = function(identifier) {
    if (!this._touches.containsKey(identifier)) return 0;
    return this._touches.get(identifier).y
};
gdjs.InputManager.prototype.getAllTouchIdentifiers = function() {
    gdjs.InputManager._allTouchIds = gdjs.InputManager._allTouchIds || [];
    gdjs.InputManager._allTouchIds.length = 0;
    for (var id in this._touches.items) {
        if (this._touches.items.hasOwnProperty(id)) {
            gdjs.InputManager._allTouchIds.push(parseInt(id, 10))
        }
    }
    return gdjs.InputManager._allTouchIds
};
gdjs.InputManager.prototype.onTouchStart = function(identifier, x, y) {
    this._startedTouches.push(identifier);
    this._touches.put(identifier, {
        x: x,
        y: y
    });
    if (this._touchSimulateMouse) {
        this.onMouseMove(x, y);
        this.onMouseButtonPressed(0)
    }
};
gdjs.InputManager.prototype.onTouchMove = function(identifier, x, y) {
    var touch = this._touches.get(identifier);
    if (!touch) return;
    touch.x = x;
    touch.y = y;
    if (this._touchSimulateMouse) {
        this.onMouseMove(x, y)
    }
};
gdjs.InputManager.prototype.onTouchEnd = function(identifier) {
    this._endedTouches.push(identifier);
    if (this._touches.containsKey(identifier)) {
        this._touches.get(identifier).justEnded = true
    }
    if (this._touchSimulateMouse) {
        this.onMouseButtonReleased(0)
    }
};
gdjs.InputManager.prototype.getStartedTouchIdentifiers = function() {
    return this._startedTouches
};
gdjs.InputManager.prototype.popStartedTouch = function() {
    return this._startedTouches.shift()
};
gdjs.InputManager.prototype.popEndedTouch = function() {
    return this._endedTouches.shift()
};
gdjs.InputManager.prototype.touchSimulateMouse = function(enable) {
    if (enable === undefined) enable = true;
    this._touchSimulateMouse = enable
};
gdjs.InputManager.prototype.onFrameEnded = function() {
    for (var id in this._touches.items) {
        if (this._touches.items.hasOwnProperty(id)) {
            var touch = this._touches.items[id];
            if (touch.justEnded) {
                this._touches.remove(id)
            }
        }
    }
    this._startedTouches.length = 0;
    this._endedTouches.length = 0;
    this._releasedKeys.clear();
    this._releasedMouseButtons.length = 0
};
gdjs.TimeManager = function() {
    this.reset()
};
gdjs.TimeManager.prototype.reset = function() {
    this._elapsedTime = 0;
    this._timeScale = 1;
    this._timeFromStart = 0;
    this._firstFrame = true;
    this._timers = new Hashtable
};
gdjs.TimeManager.prototype.update = function(elapsedTime, minimumFPS) {
    if (this._firstUpdateDone) this._firstFrame = false;
    this._firstUpdateDone = true;
    this._elapsedTime = Math.min(elapsedTime, 1e3 / minimumFPS);
    this._elapsedTime *= this._timeScale;
    for (var name in this._timers.items) {
        if (this._timers.items.hasOwnProperty(name)) {
            this._timers.items[name].updateTime(this._elapsedTime)
        }
    }
    this._timeFromStart += this._elapsedTime
};
gdjs.TimeManager.prototype.setTimeScale = function(timeScale) {
    if (timeScale >= 0) this._timeScale = timeScale
};
gdjs.TimeManager.prototype.getTimeScale = function() {
    return this._timeScale
};
gdjs.TimeManager.prototype.getTimeFromStart = function() {
    return this._timeFromStart
};
gdjs.TimeManager.prototype.isFirstFrame = function() {
    return this._firstFrame
};
gdjs.TimeManager.prototype.getElapsedTime = function() {
    return this._elapsedTime
};
gdjs.TimeManager.prototype.addTimer = function(name) {
    this._timers.put(name, new gdjs.Timer(name))
};
gdjs.TimeManager.prototype.hasTimer = function(name) {
    return this._timers.containsKey(name)
};
gdjs.TimeManager.prototype.getTimer = function(name) {
    return this._timers.get(name)
};
gdjs.TimeManager.prototype.removeTimer = function(name) {
    if (this._timers.containsKey(name)) this._timers.remove(name)
};
gdjs.RuntimeObject = function(runtimeScene, objectData) {
    this.name = objectData.name || "";
    this._nameId = gdjs.RuntimeObject.getNameIdentifier(this.name);
    this.type = objectData.type || "";
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.zOrder = 0;
    this.hidden = false;
    this.layer = "";
    this.livingOnScene = true;
    this.id = runtimeScene.createNewUniqueId();
    this._runtimeScene = runtimeScene;
    if (this._defaultHitBoxes === undefined) {
        this._defaultHitBoxes = [];
        this._defaultHitBoxes.push(gdjs.Polygon.createRectangle(0, 0))
    }
    this.hitBoxes = this._defaultHitBoxes;
    this.hitBoxesDirty = true;
    if (this.aabb === undefined) this.aabb = {
        min: [0, 0],
        max: [0, 0]
    };
    else {
        this.aabb.min[0] = 0;
        this.aabb.min[1] = 0;
        this.aabb.max[0] = 0;
        this.aabb.max[1] = 0
    }
    if (!this._variables) this._variables = new gdjs.VariablesContainer(objectData ? objectData.variables : undefined);
    else gdjs.VariablesContainer.call(this._variables, objectData ? objectData.variables : undefined);
    if (this._forces === undefined) this._forces = [];
    else this.clearForces();
    if (this._averageForce === undefined) this._averageForce = new gdjs.Force(0, 0, false);
    if (this._behaviors === undefined) this._behaviors = [];
    if (this._behaviorsTable === undefined) this._behaviorsTable = new Hashtable;
    else this._behaviorsTable.clear();
    for (var i = 0, len = objectData.behaviors.length; i < len; ++i) {
        var autoData = objectData.behaviors[i];
        var Ctor = gdjs.getBehaviorConstructor(autoData.type);
        if (i < this._behaviors.length) {
            if (this._behaviors[i] instanceof Ctor) Ctor.call(this._behaviors[i], runtimeScene, autoData, this);
            else this._behaviors[i] = new Ctor(runtimeScene, autoData, this)
        } else this._behaviors.push(new Ctor(runtimeScene, autoData, this));
        this._behaviorsTable.put(autoData.name, this._behaviors[i])
    }
    this._behaviors.length = i
};
gdjs.RuntimeObject.forcesGarbage = [];
gdjs.RuntimeObject.prototype.updateTime = function(elapsedTime) {};
gdjs.RuntimeObject.prototype.extraInitializationFromInitialInstance = function(initialInstanceData) {};
gdjs.RuntimeObject.prototype.deleteFromScene = function(runtimeScene) {
    if (this.livingOnScene) {
        runtimeScene.markObjectForDeletion(this);
        this.livingOnScene = false
    }
};
gdjs.RuntimeObject.prototype.onDeletedFromScene = function(runtimeScene) {
    var theLayer = runtimeScene.getLayer(this.layer);
    theLayer.getRenderer().removeRendererObject(this.getRendererObject())
};
gdjs.RuntimeObject.prototype.getRendererObject = function() {};
gdjs.RuntimeObject.prototype.getName = function() {
    return this.name
};
gdjs.RuntimeObject.prototype.getNameId = function() {
    return this._nameId
};
gdjs.RuntimeObject.prototype.getUniqueId = function() {
    return this.id
};
gdjs.RuntimeObject.prototype.setPosition = function(x, y) {
    this.setX(x);
    this.setY(y)
};
gdjs.RuntimeObject.prototype.setX = function(x) {
    if (x === this.x) return;
    this.x = x;
    this.hitBoxesDirty = true
};
gdjs.RuntimeObject.prototype.getX = function() {
    return this.x
};
gdjs.RuntimeObject.prototype.setY = function(y) {
    if (y === this.y) return;
    this.y = y;
    this.hitBoxesDirty = true
};
gdjs.RuntimeObject.prototype.getY = function() {
    return this.y
};
gdjs.RuntimeObject.prototype.getDrawableX = function() {
    return this.getX()
};
gdjs.RuntimeObject.prototype.getDrawableY = function() {
    return this.getY()
};
gdjs.RuntimeObject.prototype.rotateTowardPosition = function(x, y, speed, scene) {
    this.rotateTowardAngle(Math.atan2(y - (this.getDrawableY() + this.getCenterY()), x - (this.getDrawableX() + this.getCenterX())) * 180 / Math.PI, speed, scene)
};
gdjs.RuntimeObject.prototype.rotateTowardAngle = function(angle, speed, runtimeScene) {
    if (speed === 0) {
        this.setAngle(angle);
        return
    }
    var angularDiff = gdjs.evtTools.common.angleDifference(this.getAngle(), angle);
    var diffWasPositive = angularDiff >= 0;
    var newAngle = this.getAngle() + (diffWasPositive ? -1 : 1) * speed * runtimeScene.getTimeManager().getElapsedTime() / 1e3;
    if (gdjs.evtTools.common.angleDifference(newAngle, angle) > 0 ^ diffWasPositive) newAngle = angle;
    this.setAngle(newAngle);
    if (this.getAngle() != newAngle) this.setAngle(angle)
};
gdjs.RuntimeObject.prototype.rotate = function(speed, runtimeScene) {
    this.setAngle(this.getAngle() + speed * runtimeScene.getTimeManager().getElapsedTime() / 1e3)
};
gdjs.RuntimeObject.prototype.setAngle = function(angle) {
    if (this.angle === angle) return;
    this.angle = angle;
    this.hitBoxesDirty = true
};
gdjs.RuntimeObject.prototype.getAngle = function() {
    return this.angle
};
gdjs.RuntimeObject.prototype.setLayer = function(layer) {
    if (layer === this.layer) return;
    var oldLayer = this._runtimeScene.getLayer(this.layer);
    this.layer = layer;
    var newLayer = this._runtimeScene.getLayer(this.layer);
    var rendererObject = this.getRendererObject();
    oldLayer.getRenderer().removeRendererObject(rendererObject);
    newLayer.getRenderer().addRendererObject(rendererObject, this.zOrder)
};
gdjs.RuntimeObject.prototype.getLayer = function() {
    return this.layer
};
gdjs.RuntimeObject.prototype.isOnLayer = function(layer) {
    return this.layer === layer
};
gdjs.RuntimeObject.prototype.setZOrder = function(z) {
    if (z === this.zOrder) return;
    this.zOrder = z;
    var theLayer = this._runtimeScene.getLayer(this.layer);
    theLayer.getRenderer().changeRendererObjectZOrder(this.getRendererObject(), z)
};
gdjs.RuntimeObject.prototype.getZOrder = function() {
    return this.zOrder
};
gdjs.RuntimeObject.prototype.getVariables = function() {
    return this._variables
};
gdjs.RuntimeObject.getVariableNumber = function(variable) {
    return variable.getAsNumber()
};
gdjs.RuntimeObject.prototype.getVariableNumber = gdjs.RuntimeObject.getVariableNumber;
gdjs.RuntimeObject.getVariableString = function(variable) {
    return variable.getAsString()
};
gdjs.RuntimeObject.getVariableChildCount = function(variable) {
    if (variable.isStructure() == false) return 0;
    return Object.keys(variable.getAllChildren()).length
};
gdjs.RuntimeObject.prototype.getVariableString = gdjs.RuntimeObject.getVariableString;
gdjs.RuntimeObject.setVariableNumber = function(variable, newValue) {
    variable.setNumber(newValue)
};
gdjs.RuntimeObject.prototype.setVariableNumber = gdjs.RuntimeObject.setVariableNumber;
gdjs.RuntimeObject.setVariableString = function(variable, newValue) {
    variable.setString(newValue)
};
gdjs.RuntimeObject.prototype.setVariableString = gdjs.RuntimeObject.setVariableString;
gdjs.RuntimeObject.variableChildExists = function(variable, childName) {
    return variable.hasChild(childName)
};
gdjs.RuntimeObject.prototype.variableChildExists = gdjs.RuntimeObject.variableChildExists;
gdjs.RuntimeObject.variableRemoveChild = function(variable, childName) {
    return variable.removeChild(childName)
};
gdjs.RuntimeObject.prototype.variableRemoveChild = gdjs.RuntimeObject.variableRemoveChild;
gdjs.RuntimeObject.prototype.hasVariable = function(name) {
    return this._variables.has(name)
};
gdjs.RuntimeObject.prototype.hide = function(enable) {
    if (enable === undefined) enable = true;
    this.hidden = enable
};
gdjs.RuntimeObject.prototype.isVisible = function() {
    return !this.hidden
};
gdjs.RuntimeObject.prototype.isHidden = function() {
    return this.hidden
};
gdjs.RuntimeObject.prototype.getWidth = function() {
    return 0
};
gdjs.RuntimeObject.prototype.getHeight = function() {
    return 0
};
gdjs.RuntimeObject.prototype.getCenterX = function() {
    return this.getWidth() / 2
};
gdjs.RuntimeObject.prototype.getCenterY = function() {
    return this.getHeight() / 2
};
gdjs.RuntimeObject.prototype._getRecycledForce = function(x, y, clearing) {
    if (gdjs.RuntimeObject.forcesGarbage.length === 0) return new gdjs.Force(x, y, clearing);
    else {
        var recycledForce = gdjs.RuntimeObject.forcesGarbage.pop();
        recycledForce.setX(x);
        recycledForce.setY(y);
        recycledForce.setClearing(clearing);
        return recycledForce
    }
};
gdjs.RuntimeObject.prototype.addForce = function(x, y, clearing) {
    this._forces.push(this._getRecycledForce(x, y, clearing))
};
gdjs.RuntimeObject.prototype.addPolarForce = function(angle, len, clearing) {
    var forceX = Math.cos(angle / 180 * 3.14159) * len;
    var forceY = Math.sin(angle / 180 * 3.14159) * len;
    this._forces.push(this._getRecycledForce(forceX, forceY, clearing))
};
gdjs.RuntimeObject.prototype.addForceTowardPosition = function(x, y, len, clearing) {
    var angle = Math.atan2(y - (this.getDrawableY() + this.getCenterY()), x - (this.getDrawableX() + this.getCenterX()));
    var forceX = Math.cos(angle) * len;
    var forceY = Math.sin(angle) * len;
    this._forces.push(this._getRecycledForce(forceX, forceY, clearing))
};
gdjs.RuntimeObject.prototype.addForceTowardObject = function(obj, len, clearing) {
    if (obj == null) return;
    this.addForceTowardPosition(obj.getDrawableX() + obj.getCenterX(), obj.getDrawableY() + obj.getCenterY(), len, clearing)
};
gdjs.RuntimeObject.prototype.clearForces = function() {
    gdjs.RuntimeObject.forcesGarbage.push.apply(gdjs.RuntimeObject.forcesGarbage, this._forces);
    this._forces.length = 0
};
gdjs.RuntimeObject.prototype.hasNoForces = function() {
    return this._forces.length === 0
};
gdjs.RuntimeObject.prototype.updateForces = function(elapsedTime) {
    for (var i = 0; i < this._forces.length;) {
        if (this._forces[i].getClearing() === 0 || this._forces[i].getLength() <= .001) {
            gdjs.RuntimeObject.forcesGarbage.push(this._forces[i]);
            this._forces.remove(i)
        } else {
            this._forces[i].setLength(this._forces[i].getLength() - this._forces[i].getLength() * (1 - this._forces[i].getClearing()) * elapsedTime);
            ++i
        }
    }
};
gdjs.RuntimeObject.prototype.getAverageForce = function() {
    var averageX = 0;
    var averageY = 0;
    for (var i = 0, len = this._forces.length; i < len; ++i) {
        averageX += this._forces[i].getX();
        averageY += this._forces[i].getY()
    }
    this._averageForce.setX(averageX);
    this._averageForce.setY(averageY);
    return this._averageForce
};
gdjs.RuntimeObject.prototype.averageForceAngleIs = function(angle, toleranceInDegrees) {
    var averageAngle = this.getAverageForce().getAngle();
    if (averageAngle < 0) averageAngle += 360;
    return Math.abs(angle - averageAngle) < toleranceInDegrees / 2
};
gdjs.RuntimeObject.prototype.getHitBoxes = function() {
    if (this.hitBoxesDirty) {
        this.updateHitBoxes();
        this.updateAABB();
        this.hitBoxesDirty = false
    }
    return this.hitBoxes
};
gdjs.RuntimeObject.prototype.updateHitBoxes = function() {
    this.hitBoxes = this._defaultHitBoxes;
    var width = this.getWidth();
    var height = this.getHeight();
    this.hitBoxes[0].vertices[0][0] = -width / 2;
    this.hitBoxes[0].vertices[0][1] = -height / 2;
    this.hitBoxes[0].vertices[1][0] = +width / 2;
    this.hitBoxes[0].vertices[1][1] = -height / 2;
    this.hitBoxes[0].vertices[2][0] = +width / 2;
    this.hitBoxes[0].vertices[2][1] = +height / 2;
    this.hitBoxes[0].vertices[3][0] = -width / 2;
    this.hitBoxes[0].vertices[3][1] = +height / 2;
    this.hitBoxes[0].rotate(this.getAngle() / 180 * 3.14159);
    this.hitBoxes[0].move(this.getDrawableX() + this.getCenterX(), this.getDrawableY() + this.getCenterY())
};
gdjs.RuntimeObject.prototype.getAABB = function() {
    if (this.hitBoxesDirty) {
        this.updateHitBoxes();
        this.updateAABB();
        this.hitBoxesDirty = false
    }
    return this.aabb
};
gdjs.RuntimeObject.prototype.updateAABB = function() {
    this.aabb.min[0] = this.getDrawableX();
    this.aabb.min[1] = this.getDrawableY();
    this.aabb.max[0] = this.aabb.min[0] + this.getWidth();
    this.aabb.max[1] = this.aabb.min[1] + this.getHeight()
};
gdjs.RuntimeObject.prototype.stepBehaviorsPreEvents = function(runtimeScene) {
    for (var i = 0, len = this._behaviors.length; i < len; ++i) {
        this._behaviors[i].stepPreEvents(runtimeScene)
    }
};
gdjs.RuntimeObject.prototype.stepBehaviorsPostEvents = function(runtimeScene) {
    for (var i = 0, len = this._behaviors.length; i < len; ++i) {
        this._behaviors[i].stepPostEvents(runtimeScene)
    }
};
gdjs.RuntimeObject.prototype.getBehavior = function(name) {
    return this._behaviorsTable.get(name)
};
gdjs.RuntimeObject.prototype.hasBehavior = function(name) {
    return this._behaviorsTable.containsKey(name)
};
gdjs.RuntimeObject.prototype.activateBehavior = function(name, enable) {
    if (this._behaviorsTable.containsKey(name)) {
        this._behaviorsTable.get(name).activate(enable)
    }
};
gdjs.RuntimeObject.prototype.behaviorActivated = function(name) {
    if (this._behaviorsTable.containsKey(name)) {
        this._behaviorsTable.get(name).activated()
    }
    return false
};
gdjs.RuntimeObject.prototype.separateFromObjects = function(objects) {
    var moved = false;
    var xMove = 0;
    var yMove = 0;
    var hitBoxes = this.getHitBoxes();
    for (var i = 0, len = objects.length; i < len; ++i) {
        if (objects[i].id != this.id) {
            var otherHitBoxes = objects[i].getHitBoxes();
            for (var k = 0, lenk = hitBoxes.length; k < lenk; ++k) {
                for (var l = 0, lenl = otherHitBoxes.length; l < lenl; ++l) {
                    var result = gdjs.Polygon.collisionTest(hitBoxes[k], otherHitBoxes[l]);
                    if (result.collision) {
                        xMove += result.move_axis[0];
                        yMove += result.move_axis[1];
                        moved = true
                    }
                }
            }
        }
    }
    this.setPosition(this.getX() + xMove, this.getY() + yMove);
    return moved
};
gdjs.RuntimeObject.prototype.separateFromObjectsList = function(objectsLists) {
    var moved = false;
    var xMove = 0;
    var yMove = 0;
    var hitBoxes = this.getHitBoxes();
    for (var name in objectsLists.items) {
        if (objectsLists.items.hasOwnProperty(name)) {
            var objects = objectsLists.items[name];
            for (var i = 0, len = objects.length; i < len; ++i) {
                if (objects[i].id != this.id) {
                    var otherHitBoxes = objects[i].getHitBoxes();
                    for (var k = 0, lenk = hitBoxes.length; k < lenk; ++k) {
                        for (var l = 0, lenl = otherHitBoxes.length; l < lenl; ++l) {
                            var result = gdjs.Polygon.collisionTest(hitBoxes[k], otherHitBoxes[l]);
                            if (result.collision) {
                                xMove += result.move_axis[0];
                                yMove += result.move_axis[1];
                                moved = true
                            }
                        }
                    }
                }
            }
        }
    }
    this.setPosition(this.getX() + xMove, this.getY() + yMove);
    return moved
};
gdjs.RuntimeObject.prototype.getDistanceToObject = function(otherObject) {
    return Math.sqrt(this.getSqDistanceToObject(otherObject))
};
gdjs.RuntimeObject.prototype.getSqDistanceToObject = function(otherObject) {
    if (otherObject === null) return 0;
    var x = this.getX() + this.getCenterX() - (otherObject.getX() + otherObject.getCenterX());
    var y = this.getY() + this.getCenterY() - (otherObject.getY() + otherObject.getCenterY());
    return x * x + y * y
};
gdjs.RuntimeObject.prototype.getSqDistanceTo = function(pointX, pointY) {
    var x = this.getX() + this.getCenterX() - pointX;
    var y = this.getY() + this.getCenterY() - pointY;
    return x * x + y * y
};
gdjs.RuntimeObject.prototype.putAround = function(x, y, distance, angleInDegrees) {
    var angle = angleInDegrees / 180 * 3.14159;
    this.setX(x + Math.cos(angle) * distance - this.getCenterX());
    this.setY(y + Math.sin(angle) * distance - this.getCenterY())
};
gdjs.RuntimeObject.prototype.putAroundObject = function(obj, distance, angleInDegrees) {
    this.putAround(obj.getX() + obj.getCenterX(), obj.getY() + obj.getCenterY(), distance, angleInDegrees)
};
gdjs.RuntimeObject.prototype.separateObjectsWithoutForces = function(objectsLists) {
    var objects = gdjs.staticArray(gdjs.RuntimeObject.prototype.separateObjectsWithoutForces);
    objects.length = 0;
    var lists = gdjs.staticArray2(gdjs.RuntimeObject.prototype.separateObjectsWithoutForces);
    objectsLists.values(lists);
    for (var i = 0, len = lists.length; i < len; ++i) {
        objects.push.apply(objects, lists[i])
    }
    for (var i = 0, len = objects.length; i < len; ++i) {
        if (objects[i].id != this.id) {
            if (this.getDrawableX() < objects[i].getDrawableX()) {
                this.setX(objects[i].getDrawableX() - this.getWidth())
            } else if (this.getDrawableX() + this.getWidth() > objects[i].getDrawableX() + objects[i].getWidth()) {
                this.setX(objects[i].getDrawableX() + objects[i].getWidth())
            }
            if (this.getDrawableY() < objects[i].getDrawableY()) {
                this.setY(objects[i].getDrawableY() - this.getHeight())
            } else if (this.getDrawableY() + this.getHeight() > objects[i].getDrawableY() + objects[i].getHeight()) {
                this.setY(objects[i].getDrawableY() + objects[i].getHeight())
            }
        }
    }
};
gdjs.RuntimeObject.prototype.separateObjectsWithForces = function(objectsLists, len) {
    if (len == undefined) len = 10;
    var objects = gdjs.staticArray(gdjs.RuntimeObject.prototype.separateObjectsWithForces);
    objects.length = 0;
    var lists = gdjs.staticArray2(gdjs.RuntimeObject.prototype.separateObjectsWithForces);
    objectsLists.values(lists);
    for (var i = 0, len = lists.length; i < len; ++i) {
        objects.push.apply(objects, lists[i])
    }
    for (var i = 0, len = objects.length; i < len; ++i) {
        if (objects[i].id != this.id) {
            if (this.getDrawableX() + this.getCenterX() < objects[i].getDrawableX() + objects[i].getCenterX()) {
                var av = this.hasNoForces() ? 0 : this.getAverageForce().getX();
                this.addForce(-av - 10, 0, false)
            } else {
                var av = this.hasNoForces() ? 0 : this.getAverageForce().getX();
                this.addForce(-av + 10, 0, false)
            }
            if (this.getDrawableY() + this.getCenterY() < objects[i].getDrawableY() + objects[i].getCenterY()) {
                var av = this.hasNoForces() ? 0 : this.getAverageForce().getY();
                this.addForce(0, -av - 10, false)
            } else {
                var av = this.hasNoForces() ? 0 : this.getAverageForce().getY();
                this.addForce(0, -av + 10, false)
            }
        }
    }
};
gdjs.RuntimeObject.collisionTest = function(obj1, obj2) {
    var o1w = obj1.getWidth();
    var o1h = obj1.getHeight();
    var o2w = obj2.getWidth();
    var o2h = obj2.getHeight();
    var x = obj1.getDrawableX() + obj1.getCenterX() - (obj2.getDrawableX() + obj2.getCenterX());
    var y = obj1.getDrawableY() + obj1.getCenterY() - (obj2.getDrawableY() + obj2.getCenterY());
    var obj1BoundingRadius = Math.sqrt(o1w * o1w + o1h * o1h) / 2;
    var obj2BoundingRadius = Math.sqrt(o2w * o2w + o2h * o2h) / 2;
    if (Math.sqrt(x * x + y * y) > obj1BoundingRadius + obj2BoundingRadius) return false;
    var hitBoxes1 = obj1.getHitBoxes();
    var hitBoxes2 = obj2.getHitBoxes();
    for (var k = 0, lenBoxes1 = hitBoxes1.length; k < lenBoxes1; ++k) {
        for (var l = 0, lenBoxes2 = hitBoxes2.length; l < lenBoxes2; ++l) {
            if (gdjs.Polygon.collisionTest(hitBoxes1[k], hitBoxes2[l]).collision) {
                return true
            }
        }
    }
    return false
};
gdjs.RuntimeObject.distanceTest = function(obj1, obj2, distance) {
    return obj1.getSqDistanceToObject(obj2) <= distance
};
gdjs.RuntimeObject.prototype.insideObject = function(x, y) {
    return this.getDrawableX() <= x && this.getDrawableX() + this.getWidth() >= x && this.getDrawableY() <= y && this.getDrawableY() + this.getHeight() >= y
};
gdjs.RuntimeObject.prototype.cursorOnObject = function(runtimeScene) {
    var inputManager = runtimeScene.getGame().getInputManager();
    var layer = runtimeScene.getLayer(this.layer);
    var mousePos = layer.convertCoords(inputManager.getMouseX(), inputManager.getMouseY());
    if (this.insideObject(mousePos[0], mousePos[1])) {
        return true
    }
    var touchIds = inputManager.getAllTouchIdentifiers();
    for (var i = 0; i < touchIds.length; ++i) {
        var touchPos = layer.convertCoords(inputManager.getTouchX(touchIds[i]), inputManager.getTouchY(touchIds[i]));
        if (this.insideObject(touchPos[0], touchPos[1])) {
            return true
        }
    }
    return false
};
gdjs.RuntimeObject.getNameIdentifier = function(name) {
    gdjs.RuntimeObject.getNameIdentifier.identifiers = gdjs.RuntimeObject.getNameIdentifier.identifiers || new Hashtable;
    if (gdjs.RuntimeObject.getNameIdentifier.identifiers.containsKey(name)) return gdjs.RuntimeObject.getNameIdentifier.identifiers.get(name);
    gdjs.RuntimeObject.getNameIdentifier.newId = (gdjs.RuntimeObject.getNameIdentifier.newId || 0) + 1;
    var newIdentifier = gdjs.RuntimeObject.getNameIdentifier.newId;
    gdjs.RuntimeObject.getNameIdentifier.identifiers.put(name, newIdentifier);
    return newIdentifier
};
gdjs.RuntimeObject.thisIsARuntimeObjectConstructor = "";
gdjs.Profiler = function() {
    this._currentSection = null;
    this._frameIndex = 0;
    this.datas = [];
    while (this.datas.length < 30) {
        this.datas.push({})
    }
    this._averages = {};
    this._counts = {}
};
gdjs.Profiler.prototype.frameStarted = function() {
    this._currentSection = null;
    this._frameIndex++;
    if (this._frameIndex >= 30) this._frameIndex = 0;
    this._frameStart = Date.now()
};
gdjs.Profiler.prototype.begin = function(sectionName) {
    if (this._currentSection) this.end();
    this._currentSection = sectionName;
    this._currentStart = Date.now()
};
gdjs.Profiler.prototype.end = function() {
    this.datas[this._frameIndex][this._currentSection] = Date.now() - this._currentStart;
    this.datas[this._frameIndex]["total"] = Date.now() - this._frameStart
};
gdjs.Profiler.prototype.getAverage = function() {
    for (var p in this._averages) {
        if (this._averages.hasOwnProperty(p)) this._averages[p] = 0;
        if (this._counts.hasOwnProperty(p)) this._counts[p] = 0
    }
    for (var i = 0; i < this.datas.length; ++i) {
        for (var p in this.datas[i]) {
            this._averages[p] = (this._averages[p] || 0) + this.datas[i][p];
            this._counts[p] = (this._counts[p] || 0) + 1
        }
    }
    for (var p in this._averages) {
        if (this._averages.hasOwnProperty(p)) this._averages[p] /= this._counts[p]
    }
    return this._averages
};
gdjs.RuntimeScene = function(runtimeGame) {
    this._eventsFunction = null;
    this._instances = new Hashtable;
    this._instancesCache = new Hashtable;
    this._objects = new Hashtable;
    this._objectsCtor = new Hashtable;
    this._layers = new Hashtable;
    this._initialBehaviorSharedData = new Hashtable;
    this._renderer = new gdjs.RuntimeSceneRenderer(this, runtimeGame ? runtimeGame.getRenderer() : null);
    this._variables = new gdjs.VariablesContainer;
    this._runtimeGame = runtimeGame;
    this._lastId = 0;
    this._name = "";
    this._timeManager = new gdjs.TimeManager(Date.now());
    this._gameStopRequested = false;
    this._requestedScene = "";
    this._isLoaded = false;
    this._allInstancesList = [];
    this._instancesRemoved = [];
    this._profiler = new gdjs.Profiler;
    this.onCanvasResized()
};
gdjs.RuntimeScene.prototype.onCanvasResized = function() {
    this._renderer.onCanvasResized()
};
gdjs.RuntimeScene.prototype.loadFromScene = function(sceneData) {
    if (sceneData === undefined) {
        console.error("loadFromScene was called without a scene");
        return
    }
    if (this._isLoaded) this.unloadScene();
    if (this._runtimeGame) this._runtimeGame.getRenderer().setWindowTitle(sceneData.title);
    this._name = sceneData.name;
    this.setBackgroundColor(parseInt(sceneData.r, 10), parseInt(sceneData.v, 10), parseInt(sceneData.b, 10));
    for (var i = 0, len = sceneData.layers.length; i < len; ++i) {
        var layerData = sceneData.layers[i];
        this._layers.put(layerData.name, new gdjs.Layer(layerData, this))
    }
    this._variables = new gdjs.VariablesContainer(sceneData.variables);
    for (var i = 0, len = sceneData.behaviorsSharedData.length; i < len; ++i) {
        var data = sceneData.behaviorsSharedData[i];
        this._initialBehaviorSharedData.put(data.name, data)
    }
    var that = this;

    function loadObject(objData) {
        var objectName = objData.name;
        var objectType = objData.type;
        that._objects.put(objectName, objData);
        that._instances.put(objectName, []);
        that._instancesCache.put(objectName, []);
        that._objectsCtor.put(objectName, gdjs.getObjectConstructor(objectType))
    }
    var initialGlobalObjectsData = this.getGame().getInitialObjectsData();
    for (var i = 0, len = initialGlobalObjectsData.length; i < len; ++i) {
        loadObject(initialGlobalObjectsData[i])
    }
    this._initialObjectsData = sceneData.objects;
    for (var i = 0, len = this._initialObjectsData.length; i < len; ++i) {
        loadObject(this._initialObjectsData[i])
    }
    this.createObjectsFrom(sceneData.instances, 0, 0);
    var module = gdjs[sceneData.mangledName + "Code"];
    if (module && module.func) this._eventsFunction = module.func;
    else {
        console.log("Warning: no function found for running logic of scene " + this._name);
        this._eventsFunction = function() {}
    }
    this._eventsContext = new gdjs.EventsContext;
    for (var i = 0; i < gdjs.callbacksRuntimeSceneLoaded.length; ++i) {
        gdjs.callbacksRuntimeSceneLoaded[i](this)
    }
    if (sceneData.stopSoundsOnStartup && this._runtimeGame) this._runtimeGame.getSoundManager().clearAll();
    this._isLoaded = true;
    this._timeManager.reset()
};
gdjs.RuntimeScene.prototype.unloadScene = function() {
    if (!this._isLoaded) return;
    if (this._renderer && this._renderer.onSceneUnloaded) this._renderer.onSceneUnloaded();
    this._eventsContext = new gdjs.EventsContext;
    for (var i = 0; i < gdjs.callbacksRuntimeSceneUnloaded.length; ++i) {
        gdjs.callbacksRuntimeSceneUnloaded[i](this)
    }
};
gdjs.RuntimeScene.prototype.createObjectsFrom = function(data, xPos, yPos) {
    for (var i = 0, len = data.length; i < len; ++i) {
        var instanceData = data[i];
        var objectName = instanceData.name;
        var newObject = this.createObject(objectName);
        if (newObject !== null) {
            newObject.setPosition(parseFloat(instanceData.x) + xPos, parseFloat(instanceData.y) + yPos);
            newObject.setZOrder(parseFloat(instanceData.zOrder));
            newObject.setAngle(parseFloat(instanceData.angle));
            newObject.setLayer(instanceData.layer);
            newObject.getVariables().initFrom(instanceData.initialVariables, true);
            newObject.extraInitializationFromInitialInstance(instanceData)
        }
    }
};
gdjs.RuntimeScene.prototype.setEventsFunction = function(func) {
    this._eventsFunction = func
};
gdjs.RuntimeScene.prototype.renderAndStep = function(elapsedTime) {
    this._requestedChange = gdjs.RuntimeScene.CONTINUE;
    this._timeManager.update(elapsedTime, this._runtimeGame.getMinimalFramerate());
    this._updateObjectsPreEvents();
    this._eventsFunction(this, this._eventsContext);
    this._updateObjects();
    this._updateObjectsVisibility();
    this.render();
    return !!this.getRequestedChange()
};
gdjs.RuntimeScene.prototype.render = function() {
    this._renderer.render()
};
gdjs.RuntimeScene.prototype._updateLayersCameraCoordinates = function() {
    this._layersCameraCoordinates = this._layersCameraCoordinates || {};
    for (var name in this._layers.items) {
        if (this._layers.items.hasOwnProperty(name)) {
            var theLayer = this._layers.items[name];
            this._layersCameraCoordinates[name] = this._layersCameraCoordinates[name] || [0, 0, 0, 0];
            this._layersCameraCoordinates[name][0] = theLayer.getCameraX() - theLayer.getCameraWidth();
            this._layersCameraCoordinates[name][1] = theLayer.getCameraY() - theLayer.getCameraHeight();
            this._layersCameraCoordinates[name][2] = theLayer.getCameraX() + theLayer.getCameraWidth();
            this._layersCameraCoordinates[name][3] = theLayer.getCameraY() + theLayer.getCameraHeight()
        }
    }
};
gdjs.RuntimeScene.prototype._updateObjectsVisibility = function() {
    if (this._timeManager.isFirstFrame()) {
        this._constructListOfAllInstances();
        for (var i = 0, len = this._allInstancesList.length; i < len; ++i) {
            var object = this._allInstancesList[i];
            var rendererObject = object.getRendererObject();
            if (rendererObject) object.getRendererObject().visible = !object.isHidden()
        }
        return
    } else {
        this._updateLayersCameraCoordinates();
        this._constructListOfAllInstances();
        for (var i = 0, len = this._allInstancesList.length; i < len; ++i) {
            var object = this._allInstancesList[i];
            var cameraCoords = this._layersCameraCoordinates[object.getLayer()];
            var rendererObject = object.getRendererObject();
            if (!cameraCoords || !rendererObject) continue;
            if (object.isHidden()) {
                rendererObject.visible = false
            } else {
                var aabb = object.getAABB();
                if (aabb.min[0] > cameraCoords[2] || aabb.min[1] > cameraCoords[3] || aabb.max[0] < cameraCoords[0] || aabb.max[1] < cameraCoords[1]) {
                    rendererObject.visible = false
                } else {
                    rendererObject.visible = true
                }
            }
        }
    }
};
gdjs.RuntimeScene.prototype._cacheOrClearRemovedInstances = function() {
    for (var k = 0, lenk = this._instancesRemoved.length; k < lenk; ++k) {
        var cache = this._instancesCache.get(this._instancesRemoved[k].getName());
        if (cache.length < 128) cache.push(this._instancesRemoved[k])
    }
    this._instancesRemoved.length = 0
};
gdjs.RuntimeScene.prototype._constructListOfAllInstances = function() {
    var currentListSize = 0;
    for (var name in this._instances.items) {
        if (this._instances.items.hasOwnProperty(name)) {
            var list = this._instances.items[name];
            var oldSize = currentListSize;
            currentListSize += list.length;
            for (var j = 0, lenj = list.length; j < lenj; ++j) {
                if (oldSize + j < this._allInstancesList.length) this._allInstancesList[oldSize + j] = list[j];
                else this._allInstancesList.push(list[j])
            }
        }
    }
    this._allInstancesList.length = currentListSize
};
gdjs.RuntimeScene.prototype._updateObjectsPreEvents = function() {
    this._constructListOfAllInstances();
    for (var i = 0, len = this._allInstancesList.length; i < len; ++i) {
        this._allInstancesList[i].stepBehaviorsPreEvents(this)
    }
    this._cacheOrClearRemovedInstances()
};
gdjs.RuntimeScene.prototype._updateObjects = function() {
    this._cacheOrClearRemovedInstances();
    this.updateObjectsForces();
    this._constructListOfAllInstances();
    var elapsedTimeInSeconds = this._timeManager.getElapsedTime() / 1e3;
    for (var i = 0, len = this._allInstancesList.length; i < len; ++i) {
        this._allInstancesList[i].updateTime(elapsedTimeInSeconds);
        this._allInstancesList[i].stepBehaviorsPostEvents(this)
    }
    this._cacheOrClearRemovedInstances()
};
gdjs.RuntimeScene.prototype.setBackgroundColor = function(r, g, b) {
    this._backgroundColor = parseInt(gdjs.rgbToHex(r, g, b), 16)
};
gdjs.RuntimeScene.prototype.getBackgroundColor = function() {
    return this._backgroundColor
};
gdjs.RuntimeScene.prototype.getName = function() {
    return this._name
};
gdjs.RuntimeScene.prototype.updateObjectsForces = function() {
    var elapsedTimeInSeconds = this._timeManager.getElapsedTime() / 1e3;
    for (var name in this._instances.items) {
        if (this._instances.items.hasOwnProperty(name)) {
            var list = this._instances.items[name];
            for (var j = 0, listLen = list.length; j < listLen; ++j) {
                var obj = list[j];
                if (!obj.hasNoForces()) {
                    var averageForce = obj.getAverageForce();
                    obj.setX(obj.getX() + averageForce.getX() * elapsedTimeInSeconds);
                    obj.setY(obj.getY() + averageForce.getY() * elapsedTimeInSeconds);
                    obj.updateForces(elapsedTimeInSeconds)
                }
            }
        }
    }
};
gdjs.RuntimeScene.prototype.addObject = function(obj) {
    if (!this._instances.containsKey(obj.name)) {
        console.log('RuntimeScene.addObject: No objects called "' + obj.name + '"! Adding it.');
        this._instances.put(obj.name, [])
    }
    this._instances.get(obj.name).push(obj)
};
gdjs.RuntimeScene.prototype.getObjects = function(name) {
    if (!this._instances.containsKey(name)) {
        console.log('RuntimeScene.getObjects: No instances called "' + name + '"! Adding it.');
        this._instances.put(name, [])
    }
    return this._instances.get(name)
};
gdjs.RuntimeScene.prototype.createObject = function(objectName) {
    if (!this._objectsCtor.containsKey(objectName) || !this._objects.containsKey(objectName)) return null;
    var cache = this._instancesCache.get(objectName);
    var ctor = this._objectsCtor.get(objectName);
    var obj = null;
    if (cache.length === 0) {
        obj = new ctor(this, this._objects.get(objectName))
    } else {
        obj = cache.pop();
        ctor.call(obj, this, this._objects.get(objectName))
    }
    this.addObject(obj);
    return obj
};
gdjs.RuntimeScene.prototype.markObjectForDeletion = function(obj) {
    if (this._instancesRemoved.indexOf(obj) === -1) this._instancesRemoved.push(obj);
    if (this._instances.containsKey(obj.getName())) {
        var objId = obj.id;
        var allInstances = this._instances.get(obj.getName());
        for (var i = 0, len = allInstances.length; i < len; ++i) {
            if (allInstances[i].id == objId) {
                allInstances.remove(i);
                break
            }
        }
    }
    obj.onDeletedFromScene(this);
    for (var j = 0, lenj = obj._behaviors.length; j < lenj; ++j) {
        obj._behaviors[j].ownerRemovedFromScene()
    }
    for (var j = 0; j < gdjs.callbacksObjectDeletedFromScene.length; ++j) {
        gdjs.callbacksObjectDeletedFromScene[j](this, obj)
    }
    return
};
gdjs.RuntimeScene.prototype.createNewUniqueId = function() {
    this._lastId++;
    return this._lastId
};
gdjs.RuntimeScene.prototype.getRenderer = function() {
    return this._renderer
};
gdjs.RuntimeScene.prototype.getGame = function() {
    return this._runtimeGame
};
gdjs.RuntimeScene.prototype.getVariables = function() {
    return this._variables
};
gdjs.RuntimeScene.prototype.getInitialSharedDataForBehavior = function(name) {
    if (this._initialBehaviorSharedData.containsKey(name)) {
        return this._initialBehaviorSharedData.get(name)
    }
    return null
};
gdjs.RuntimeScene.prototype.getLayer = function(name) {
    if (this._layers.containsKey(name)) return this._layers.get(name);
    return this._layers.get("")
};
gdjs.RuntimeScene.prototype.hasLayer = function(name) {
    return this._layers.containsKey(name)
};
gdjs.RuntimeScene.prototype.getAllLayerNames = function(result) {
    this._layers.keys(result)
};
gdjs.RuntimeScene.prototype.getTimeManager = function() {
    return this._timeManager
};
gdjs.RuntimeScene.prototype.getSoundManager = function() {
    return this._runtimeGame.getSoundManager()
};
gdjs.RuntimeScene.CONTINUE = 0;
gdjs.RuntimeScene.PUSH_SCENE = 1;
gdjs.RuntimeScene.POP_SCENE = 2;
gdjs.RuntimeScene.REPLACE_SCENE = 3;
gdjs.RuntimeScene.CLEAR_SCENES = 4;
gdjs.RuntimeScene.STOP_GAME = 5;
gdjs.RuntimeScene.prototype.getRequestedChange = function() {
    return this._requestedChange
};
gdjs.RuntimeScene.prototype.getRequestedScene = function() {
    return this._requestedScene
};
gdjs.RuntimeScene.prototype.requestChange = function(change, sceneName) {
    this._requestedChange = change;
    this._requestedScene = sceneName
};
gdjs.SceneStack = function(runtimeGame) {
    if (!runtimeGame) {
        throw "SceneStack must be constructed with a gdjs.RuntimeGame."
    }
    this._runtimeGame = runtimeGame;
    this._stack = []
};
gdjs.SceneStack.prototype.onRendererResized = function() {
    for (var i = 0; i < this._stack.length; ++i) {
        this._stack[i].onCanvasResized()
    }
};
gdjs.SceneStack.prototype.step = function(elapsedTime) {
    if (this._stack.length === 0) return false;
    var currentScene = this._stack[this._stack.length - 1];
    if (currentScene.renderAndStep(elapsedTime)) {
        var request = currentScene.getRequestedChange();
        if (request === gdjs.RuntimeScene.STOP_GAME) {
            return false
        } else if (request === gdjs.RuntimeScene.POP_SCENE) {
            this.pop()
        } else if (request === gdjs.RuntimeScene.PUSH_SCENE) {
            this.push(currentScene.getRequestedScene())
        } else if (request === gdjs.RuntimeScene.REPLACE_SCENE) {
            this.replace(currentScene.getRequestedScene())
        } else if (request === gdjs.RuntimeScene.CLEAR_SCENES) {
            this.replace(currentScene.getRequestedScene(), true)
        } else {
            console.error("Unrecognized change in scene stack.");
            return false
        }
    }
    return true
};
gdjs.SceneStack.prototype.pop = function() {
    if (this._stack.length <= 1) return null;
    var scene = this._stack.pop();
    scene.unloadScene();
    return scene
};
gdjs.SceneStack.prototype.push = function(newSceneName, externalLayoutName) {
    var newScene = new gdjs.RuntimeScene(this._runtimeGame);
    newScene.loadFromScene(this._runtimeGame.getSceneData(newSceneName));
    if (externalLayoutName) {
        var externalLayoutData = this._runtimeGame.getExternalLayoutData(externalLayoutName);
        if (externalLayoutData) newScene.createObjectsFrom(externalLayoutData.instances, 0, 0)
    }
    this._stack.push(newScene);
    return newScene
};
gdjs.SceneStack.prototype.replace = function(newSceneName, clear) {
    if (!!clear) {
        while (this._stack.length !== 0) {
            var scene = this._stack.pop();
            scene.unloadScene()
        }
    } else {
        if (this._stack.length !== 0) {
            var scene = this._stack.pop();
            scene.unloadScene()
        }
    }
    return this.push(newSceneName)
};
gdjs.Polygon = function() {
    this.vertices = [];
    this.edges = [];
    this.center = [0, 0]
};
gdjs.Polygon.prototype.move = function(x, y) {
    for (var i = 0, len = this.vertices.length; i < len; ++i) {
        this.vertices[i][0] += x;
        this.vertices[i][1] += y
    }
};
gdjs.Polygon.prototype.rotate = function(angle) {
    var t, cosa = Math.cos(-angle),
        sina = Math.sin(-angle);
    for (var i = 0, len = this.vertices.length; i < len; ++i) {
        t = this.vertices[i][0];
        this.vertices[i][0] = t * cosa + this.vertices[i][1] * sina;
        this.vertices[i][1] = -t * sina + this.vertices[i][1] * cosa
    }
};
gdjs.Polygon.prototype.computeEdges = function() {
    var v1, v2;
    while (this.edges.length < this.vertices.length) {
        this.edges.push([0, 0])
    }
    if (this.edges.length != this.vertices.length) this.edges.length = this.vertices.length;
    for (var i = 0, len = this.vertices.length; i < len; ++i) {
        v1 = this.vertices[i];
        if (i + 1 >= len) v2 = this.vertices[0];
        else v2 = this.vertices[i + 1];
        this.edges[i][0] = v2[0] - v1[0];
        this.edges[i][1] = v2[1] - v1[1]
    }
};
gdjs.Polygon.prototype.isConvex = function() {
    this.computeEdges();
    edgesLen = this.edges.length;
    if (edgesLen < 3) {
        return false
    }
    var zProductIsPositive = this.edges[0][0] * this.edges[0 + 1][1] - this.edges[0][1] * this.edges[0 + 1][0] > 0;
    for (var i = 1; i < edgesLen - 1; ++i) {
        var zCrossProduct = this.edges[i][0] * this.edges[i + 1][1] - this.edges[i][1] * this.edges[i + 1][0];
        if (zCrossProduct > 0 !== zProductIsPositive) return false
    }
    var lastZCrossProduct = this.edges[edgesLen - 1][0] * this.edges[0][1] - this.edges[edgesLen][1] * this.edges[0][0];
    if (lastZCrossProduct > 0 !== zProductIsPositive) return false;
    return true
};
gdjs.Polygon.prototype.computeCenter = function() {
    this.center[0] = 0;
    this.center[1] = 0;
    var len = this.vertices.length;
    for (var i = 0; i < len; ++i) {
        this.center[0] += this.vertices[i][0];
        this.center[1] += this.vertices[i][1]
    }
    this.center[0] /= len;
    this.center[1] /= len;
    return this.center
};
gdjs.Polygon.createRectangle = function(width, height) {
    var rect = new gdjs.Polygon;
    rect.vertices.push([-width / 2, -height / 2]);
    rect.vertices.push([+width / 2, -height / 2]);
    rect.vertices.push([+width / 2, +height / 2]);
    rect.vertices.push([-width / 2, +height / 2]);
    return rect
};
gdjs.Polygon.collisionTest = function(p1, p2) {
    p1.computeEdges();
    p2.computeEdges();
    var edge = gdjs.Polygon.collisionTest._statics.edge;
    var move_axis = gdjs.Polygon.collisionTest._statics.move_axis;
    var result = gdjs.Polygon.collisionTest._statics.result;
    var minDist = Number.MAX_VALUE;
    edge[0] = 0;
    edge[1] = 0;
    edge[0] = 0;
    edge[1] = 0;
    result.collision = false;
    result.move_axis[0] = 0;
    result.move_axis[1] = 0;
    for (var i = 0, len1 = p1.vertices.length, len2 = p2.vertices.length; i < len1 + len2; i++) {
        if (i < len1) {
            edge = p1.edges[i]
        } else {
            edge = p2.edges[i - len1]
        }
        var axis = gdjs.Polygon.collisionTest._statics.axis;
        axis[0] = -edge[1];
        axis[1] = edge[0];
        gdjs.Polygon.normalise(axis);
        var minMaxA = gdjs.Polygon.collisionTest._statics.minMaxA;
        var minMaxB = gdjs.Polygon.collisionTest._statics.minMaxB;
        gdjs.Polygon.project(axis, p1, minMaxA);
        gdjs.Polygon.project(axis, p2, minMaxB);
        if (gdjs.Polygon.distance(minMaxA[0], minMaxA[1], minMaxB[0], minMaxB[1]) > 0) {
            result.collision = false;
            result.move_axis[0] = 0;
            result.move_axis[1] = 0;
            return result
        }
        var dist = Math.abs(gdjs.Polygon.distance(minMaxA[0], minMaxA[1], minMaxB[0], minMaxB[1]));
        if (dist < minDist) {
            minDist = dist;
            move_axis[0] = axis[0];
            move_axis[1] = axis[1]
        }
    }
    result.collision = true;
    var p1Center = p1.computeCenter();
    var p2Center = p2.computeCenter();
    var d = [p1Center[0] - p2Center[0], p1Center[1] - p2Center[1]];
    if (gdjs.Polygon.dotProduct(d, move_axis) < 0) {
        move_axis[0] = -move_axis[0];
        move_axis[1] = -move_axis[1]
    }
    result.move_axis[0] = move_axis[0] * minDist;
    result.move_axis[1] = move_axis[1] * minDist;
    return result
};
gdjs.Polygon.collisionTest._statics = {
    minMaxA: [0, 0],
    minMaxB: [0, 0],
    edge: [0, 0],
    axis: [0, 0],
    move_axis: [0, 0],
    result: {
        collision: false,
        move_axis: [0, 0]
    }
};
gdjs.Polygon.normalise = function(v) {
    var len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    if (len != 0) {
        v[0] /= len;
        v[1] /= len
    }
};
gdjs.Polygon.dotProduct = function(a, b) {
    var dp = a[0] * b[0] + a[1] * b[1];
    return dp
};
gdjs.Polygon.project = function(axis, p, result) {
    var dp = gdjs.Polygon.dotProduct(axis, p.vertices[0]);
    result[0] = dp;
    result[1] = dp;
    for (var i = 1, len = p.vertices.length; i < len; ++i) {
        dp = gdjs.Polygon.dotProduct(axis, p.vertices[i]);
        if (dp < result[0]) result[0] = dp;
        else if (dp > result[1]) result[1] = dp
    }
};
gdjs.Polygon.distance = function(minA, maxA, minB, maxB) {
    if (minA < minB) return minB - maxA;
    else return minA - maxB
};
gdjs.Force = function(x, y, clearing) {
    this._x = x || 0;
    this._y = y || 0;
    this._angle = Math.atan2(y, x) * 180 / 3.14159;
    this._length = Math.sqrt(x * x + y * y);
    this._dirty = false;
    this._clearing = clearing
};
gdjs.Force.prototype.getX = function() {
    return this._x
};
gdjs.Force.prototype.getY = function() {
    return this._y
};
gdjs.Force.prototype.setX = function(x) {
    this._x = x;
    this._dirty = true
};
gdjs.Force.prototype.setY = function(y) {
    this._y = y;
    this._dirty = true
};
gdjs.Force.prototype.setAngle = function(angle) {
    if (this._dirty) {
        this._length = Math.sqrt(this._x * this._x + this._y * this._y);
        this._dirty = false
    }
    this._angle = angle;
    this._x = Math.cos(angle / 180 * 3.14159) * this._length;
    this._y = Math.sin(angle / 180 * 3.14159) * this._length
};
gdjs.Force.prototype.setLength = function(len) {
    if (this._dirty) {
        this._angle = Math.atan2(this._y, this._x) * 180 / 3.14159;
        this._dirty = false
    }
    this._length = len;
    this._x = Math.cos(this._angle / 180 * 3.14159) * this._length;
    this._y = Math.sin(this._angle / 180 * 3.14159) * this._length
};
gdjs.Force.prototype.getAngle = function() {
    if (this._dirty) {
        this._angle = Math.atan2(this._y, this._x) * 180 / 3.14159;
        this._length = Math.sqrt(this._x * this._x + this._y * this._y);
        this._dirty = false
    }
    return this._angle
};
gdjs.Force.prototype.getLength = function() {
    if (this._dirty) {
        this._angle = Math.atan2(this._y, this._x) * 180 / 3.14159;
        this._length = Math.sqrt(this._x * this._x + this._y * this._y);
        this._dirty = false
    }
    return this._length
};
gdjs.Force.prototype.getClearing = function() {
    return this._clearing
};
gdjs.Force.prototype.setClearing = function(clearing) {
    this._clearing = clearing
};
gdjs.Layer = function(layerData, runtimeScene) {
    this._name = layerData.name;
    this._cameraRotation = 0;
    this._zoomFactor = 1;
    this._hidden = !layerData.visibility;
    this._effects = layerData.effects || [];
    this._cameraX = runtimeScene.getGame().getDefaultWidth() / 2;
    this._cameraY = runtimeScene.getGame().getDefaultHeight() / 2;
    this._width = runtimeScene.getGame().getDefaultWidth();
    this._height = runtimeScene.getGame().getDefaultHeight();
    this._renderer = new gdjs.LayerRenderer(this, runtimeScene.getRenderer());
    this.show(!this._hidden);
    this.setEffectsDefaultParameters()
};
gdjs.Layer.prototype.getRenderer = function() {
    return this._renderer
};
gdjs.Layer.prototype.getName = function() {
    return this._name
};
gdjs.Layer.prototype.getCameraX = function(cameraId) {
    return this._cameraX
};
gdjs.Layer.prototype.getCameraY = function(cameraId) {
    return this._cameraY
};
gdjs.Layer.prototype.setCameraX = function(x, cameraId) {
    this._cameraX = x;
    this._renderer.updatePosition()
};
gdjs.Layer.prototype.setCameraY = function(y, cameraId) {
    this._cameraY = y;
    this._renderer.updatePosition()
};
gdjs.Layer.prototype.getCameraWidth = function(cameraId) {
    return +this._width * 1 / this._zoomFactor
};
gdjs.Layer.prototype.getCameraHeight = function(cameraId) {
    return +this._height * 1 / this._zoomFactor
};
gdjs.Layer.prototype.show = function(enable) {
    this._hidden = !enable;
    this._renderer.updateVisibility(enable)
};
gdjs.Layer.prototype.isVisible = function() {
    return !this._hidden
};
gdjs.Layer.prototype.setCameraZoom = function(newZoom, cameraId) {
    this._zoomFactor = newZoom;
    this._renderer.updatePosition()
};
gdjs.Layer.prototype.getCameraZoom = function(cameraId) {
    return this._zoomFactor
};
gdjs.Layer.prototype.getCameraRotation = function(cameraId) {
    return this._cameraRotation
};
gdjs.Layer.prototype.setCameraRotation = function(rotation, cameraId) {
    this._cameraRotation = rotation;
    this._renderer.updatePosition()
};
gdjs.Layer.prototype.convertCoords = function(x, y, cameraId) {
    x -= this._width / 2;
    y -= this._height / 2;
    x /= Math.abs(this._zoomFactor);
    y /= Math.abs(this._zoomFactor);
    var tmp = x;
    x = Math.cos(this._cameraRotation / 180 * 3.14159) * x - Math.sin(this._cameraRotation / 180 * 3.14159) * y;
    y = Math.sin(this._cameraRotation / 180 * 3.14159) * tmp + Math.cos(this._cameraRotation / 180 * 3.14159) * y;
    return [x + this.getCameraX(cameraId), y + this.getCameraY(cameraId)]
};
gdjs.Layer.prototype.convertInverseCoords = function(x, y, cameraId) {
    x -= this.getCameraX(cameraId);
    y -= this.getCameraY(cameraId);
    var tmp = x;
    x = Math.cos(-this._cameraRotation / 180 * 3.14159) * x - Math.sin(-this._cameraRotation / 180 * 3.14159) * y;
    y = Math.sin(-this._cameraRotation / 180 * 3.14159) * tmp + Math.cos(-this._cameraRotation / 180 * 3.14159) * y;
    x *= Math.abs(this._zoomFactor);
    y *= Math.abs(this._zoomFactor);
    return [x + this._width / 2, y + this._height / 2]
};
gdjs.Layer.prototype.getWidth = function() {
    return this._width
};
gdjs.Layer.prototype.getHeight = function() {
    return this._height
};
gdjs.Layer.prototype.getEffects = function() {
    return this._effects
};
gdjs.Layer.prototype.setEffectParameter = function(name, parameterIndex, value) {
    return this._renderer.setEffectParameter(name, parameterIndex, value)
};
gdjs.Layer.prototype.setEffectsDefaultParameters = function() {
    for (var i = 0; i < this._effects.length; ++i) {
        var effect = this._effects[i];
        for (var name in effect.parameters) {
            this.setEffectParameter(effect.name, name, effect.parameters[name])
        }
    }
};
gdjs.Timer = function(name) {
    this._name = name;
    this._time = 0;
    this._paused = false
};
gdjs.Timer.prototype.getName = function() {
    return this._name
};
gdjs.Timer.prototype.getTime = function() {
    return this._time
};
gdjs.Timer.prototype.updateTime = function(time) {
    if (!this._paused) this._time += time
};
gdjs.Timer.prototype.setTime = function(time) {
    this._time = time
};
gdjs.Timer.prototype.reset = function(time) {
    this.setTime(0)
};
gdjs.Timer.prototype.setPaused = function(enable) {
    this._paused = enable
};
gdjs.Timer.prototype.isPaused = function() {
    return this._paused
};
gdjs.RuntimeGame = function(data, spec) {
    spec = spec || {};
    this._variables = new gdjs.VariablesContainer(data.variables);
    this._data = data;
    this._imageManager = new gdjs.ImageManager(data.resources ? data.resources.resources : undefined);
    this._soundManager = new gdjs.SoundManager(data.resources ? data.resources.resources : undefined);
    this._minFPS = data ? parseInt(data.properties.minFPS, 10) : 15;
    this._defaultWidth = data.properties.windowWidth;
    this._defaultHeight = data.properties.windowHeight;
    this._originalWidth = data.properties.windowWidth;
    this._originalHeight = data.properties.windowHeight;
    this._renderer = new gdjs.RuntimeGameRenderer(this, this._defaultWidth, this._defaultHeight, spec.forceFullscreen || false);
    this._sceneStack = new gdjs.SceneStack(this);
    this._notifySceneForResize = false;
    this._inputManager = new gdjs.InputManager;
    this._injectExternalLayout = spec.injectExternalLayout || ""
};
gdjs.RuntimeGame.prototype.getRenderer = function() {
    return this._renderer
};
gdjs.RuntimeGame.prototype.getVariables = function() {
    return this._variables
};
gdjs.RuntimeGame.prototype.getSoundManager = function() {
    return this._soundManager
};
gdjs.RuntimeGame.prototype.getImageManager = function() {
    return this._imageManager
};
gdjs.RuntimeGame.prototype.getInputManager = function() {
    return this._inputManager
};
gdjs.RuntimeGame.prototype.getGameData = function() {
    return this._data
};
gdjs.RuntimeGame.prototype.getSceneData = function(sceneName) {
    var scene = undefined;
    for (var i = 0, len = this._data.layouts.length; i < len; ++i) {
        var sceneData = this._data.layouts[i];
        if (sceneName === undefined || sceneData.name === sceneName) {
            scene = sceneData;
            break
        }
    }
    if (scene === undefined) console.warn('The game has no scene called "' + sceneName + '"');
    return scene
};
gdjs.RuntimeGame.prototype.hasScene = function(sceneName) {
    var isTrue = false;
    for (var i = 0, len = this._data.layouts.length; i < len; ++i) {
        var sceneData = this._data.layouts[i];
        if (sceneName === undefined || sceneData.name == sceneName) {
            isTrue = true;
            break
        }
    }
    return isTrue
};
gdjs.RuntimeGame.prototype.getExternalLayoutData = function(name) {
    var externalLayout = null;
    for (var i = 0, len = this._data.externalLayouts.length; i < len; ++i) {
        var layoutData = this._data.externalLayouts[i];
        if (layoutData.name === name) {
            externalLayout = layoutData;
            break
        }
    }
    return externalLayout
};
gdjs.RuntimeGame.prototype.getInitialObjectsData = function() {
    return this._data.objects || []
};
gdjs.RuntimeGame.prototype.getOriginalWidth = function() {
    return this._originalWidth
};
gdjs.RuntimeGame.prototype.getOriginalHeight = function() {
    return this._originalHeight
};
gdjs.RuntimeGame.prototype.getDefaultWidth = function() {
    return this._defaultWidth
};
gdjs.RuntimeGame.prototype.getDefaultHeight = function() {
    return this._defaultHeight
};
gdjs.RuntimeGame.prototype.setDefaultWidth = function(width) {
    this._defaultWidth = width
};
gdjs.RuntimeGame.prototype.setDefaultHeight = function(height) {
    this._defaultHeight = height
};
gdjs.RuntimeGame.prototype.getMinimalFramerate = function() {
    return this._minFPS
};
gdjs.RuntimeGame.prototype.loadAllAssets = function(callback) {
    var loadingScreen = new gdjs.LoadingScreenRenderer(this.getRenderer());
    var allAssetsTotal = this._data.resources.resources.length;
    var that = this;
    this._imageManager.loadTextures(function(count, total) {
        loadingScreen.render(Math.floor(count / allAssetsTotal * 100))
    }, function() {
        that._soundManager.preloadAudio(function(count, total) {
            loadingScreen.render(Math.floor((allAssetsTotal - total + count) / allAssetsTotal * 100))
        }, function() {
            callback()
        })
    })
};
gdjs.RuntimeGame.prototype.startGameLoop = function() {
    if (!this.hasScene()) {
        console.log("The game has no scene.");
        return
    }
    var firstSceneName = gdjs.projectData.firstLayout;
    this._sceneStack.push(this.hasScene(firstSceneName) ? firstSceneName : this.getSceneData().name, this._injectExternalLayout);
    var that = this;
    this._renderer.startGameLoop(function(elapsedTime) {
        if (that._notifySceneForResize) {
            that._sceneStack.onRendererResized();
            that._notifySceneForResize = false
        }
        if (that._sceneStack.step(elapsedTime)) {
            that.getInputManager().onFrameEnded();
            return true
        }
        return false
    })
};
gdjs.Variable = function(varData) {
    this._value = 0;
    this._str = "";
    this._numberDirty = false;
    this._stringDirty = true;
    this._isStructure = false;
    this._children = {};
    this._undefinedInContainer = false;
    if (varData !== undefined) {
        if (varData.value !== undefined) {
            var initialValue = varData.value;
            var valueWhenConsideredAsNumber = parseFloat(initialValue, 10);
            if (valueWhenConsideredAsNumber === valueWhenConsideredAsNumber) {
                this._value = parseFloat(initialValue, 10)
            } else {
                if (initialValue.length === 0) this._value = 0;
                else {
                    this._str = initialValue;
                    this._numberDirty = true;
                    this._stringDirty = false
                }
            }
        } else {
            this._isStructure = true;
            if (varData.children !== undefined) {
                for (var i = 0, len = varData.children.length; i < len; ++i) {
                    var childData = varData.children[i];
                    this._children[childData.name] = new gdjs.Variable(childData)
                }
            }
        }
    }
};
gdjs.Variable.prototype.setUndefinedInContainer = function() {
    this._undefinedInContainer = true
};
gdjs.Variable.prototype.isUndefinedInContainer = function() {
    return this._undefinedInContainer
};
gdjs.Variable.prototype.getChild = function(childName) {
    if (this._children.hasOwnProperty(childName) && this._children[childName] !== undefined) return this._children[childName];
    this._isStructure = true;
    this._children[childName] = new gdjs.Variable;
    return this._children[childName]
};
gdjs.Variable.prototype.hasChild = function(childName) {
    return this._isStructure && this._children.hasOwnProperty(childName)
};
gdjs.Variable.prototype.removeChild = function(childName) {
    if (!this._isStructure) return;
    delete this._children[childName]
};
gdjs.Variable.prototype.getAsNumber = function() {
    if (this._numberDirty) {
        this._value = parseFloat(this._str, 10);
        if (this._value !== this._value) this._value = 0;
        this._numberDirty = false
    }
    return this._value
};
gdjs.Variable.prototype.setNumber = function(newValue) {
    this._value = newValue;
    this._stringDirty = true;
    this._numberDirty = false
};
gdjs.Variable.prototype.getAsString = function() {
    if (this._stringDirty) {
        this._str = this._value.toString();
        this._stringDirty = false
    }
    return this._str
};
gdjs.Variable.prototype.setString = function(newValue) {
    this._str = newValue;
    this._numberDirty = true;
    this._stringDirty = false
};
gdjs.Variable.prototype.isStructure = function() {
    return this._isStructure
};
gdjs.Variable.prototype.isNumber = function() {
    return !this._isStructure && !this._numberDirty
};
gdjs.Variable.prototype.getAllChildren = function() {
    return this._children
};
gdjs.Variable.prototype.add = function(val) {
    this.setNumber(this.getAsNumber() + val)
};
gdjs.Variable.prototype.sub = function(val) {
    this.setNumber(this.getAsNumber() - val)
};
gdjs.Variable.prototype.mul = function(val) {
    this.setNumber(this.getAsNumber() * val)
};
gdjs.Variable.prototype.div = function(val) {
    this.setNumber(this.getAsNumber() / val)
};
gdjs.Variable.prototype.concatenate = function(str) {
    this.setString(this.getAsString() + str)
};
gdjs.VariablesContainer = function(initialVariablesData) {
    if (this._variables == undefined) this._variables = new Hashtable;
    if (this._variablesArray == undefined) this._variablesArray = [];
    if (initialVariablesData != undefined) this.initFrom(initialVariablesData)
};
gdjs.VariablesContainer.prototype.initFrom = function(data, keepOldVariables) {
    if (keepOldVariables == undefined) keepOldVariables = false;
    if (!keepOldVariables) {
        gdjs.VariablesContainer._deletedVars = gdjs.VariablesContainer._deletedVars || [];
        this._variables.keys(gdjs.VariablesContainer._deletedVars)
    }
    var that = this;
    var i = 0;
    for (var j = 0; j < data.length; ++j) {
        var varData = data[j];
        var variable = that.get(varData.name);
        gdjs.Variable.call(variable, varData);
        if (!keepOldVariables) {
            if (i < that._variablesArray.length) that._variablesArray[i] = variable;
            else that._variablesArray.push(variable);
            ++i;
            var idx = gdjs.VariablesContainer._deletedVars.indexOf(varData.name);
            if (idx !== -1) gdjs.VariablesContainer._deletedVars[idx] = undefined
        }
    }
    if (!keepOldVariables) {
        this._variablesArray.length = i;
        for (var i = 0, len = gdjs.VariablesContainer._deletedVars.length; i < len; ++i) {
            var variableName = gdjs.VariablesContainer._deletedVars[i];
            if (variableName != undefined) this._variables.get(variableName).setUndefinedInContainer()
        }
    }
};
gdjs.VariablesContainer.prototype.add = function(name, variable) {
    this._variables.put(name, variable)
};
gdjs.VariablesContainer.prototype.remove = function(name) {
    if (this._variables.containsKey(name)) {
        this._variables.get(name).setUndefinedInContainer()
    }
};
gdjs.VariablesContainer.prototype.get = function(name) {
    var variable = null;
    if (!this._variables.containsKey(name)) {
        variable = new gdjs.Variable;
        this._variables.put(name, variable)
    } else {
        variable = this._variables.get(name);
        if (variable.isUndefinedInContainer()) {
            gdjs.Variable.call(variable)
        }
    }
    return variable
};
gdjs.VariablesContainer.prototype.getFromIndex = function(id) {
    if (id >= this._variablesArray.length) {
        var variable = new gdjs.Variable;
        return this._variables.put(name, variable)
    } else {
        var variable = this._variablesArray[id];
        if (variable.isUndefinedInContainer()) {
            gdjs.Variable.call(variable)
        }
        return variable
    }
};
gdjs.VariablesContainer.prototype.has = function(name) {
    return this._variables.containsKey(name) && !this._variables.get(name).isUndefinedInContainer()
};
gdjs.VariablesContainer.badVariablesContainer = {
    has: function() {
        return false
    },
    getFromIndex: function() {
        return gdjs.VariablesContainer.badVariable
    },
    get: function() {
        return gdjs.VariablesContainer.badVariable
    },
    remove: function() {
        return
    },
    add: function() {
        return
    },
    initFrom: function() {
        return
    }
};
gdjs.VariablesContainer.badVariable = {
    getChild: function() {
        return gdjs.VariablesContainer.badVariable
    },
    hasChild: function() {
        return false
    },
    isStructure: function() {
        return false
    },
    isNumber: function() {
        return true
    },
    removeChild: function() {
        return
    },
    setNumber: function() {
        return
    },
    setString: function() {
        return
    },
    getAsString: function() {
        return ""
    },
    getAsNumber: function() {
        return 0
    },
    getAllChildren: function() {
        return {}
    },
    add: function() {
        return
    },
    sub: function() {
        return
    },
    mul: function() {
        return
    },
    div: function() {
        return
    },
    concatenate: function() {
        return
    },
    setUndefinedInContainer: function() {
        return
    },
    isUndefinedInContainer: function() {
        return
    }
};
gdjs.EventsContext = function() {
    this._objectsMapCache = [];
    this._onceTriggers = {};
    this._lastFrameOnceTrigger = {}
};
gdjs.EventsContext.prototype.startNewFrame = function() {
    this.clearObject(this._lastFrameOnceTrigger);
    for (var k in this._onceTriggers) {
        if (this._onceTriggers.hasOwnProperty(k)) {
            this._lastFrameOnceTrigger[k] = this._onceTriggers[k];
            delete this._onceTriggers[k]
        }
    }
    this._currentObjectsMap = 0
};
gdjs.EventsContext.prototype.triggerOnce = function(triggerId) {
    this._onceTriggers[triggerId] = true;
    return !this._lastFrameOnceTrigger.hasOwnProperty(triggerId)
};
gdjs.EventsContext.prototype.clearObject = function(obj) {
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            delete obj[k]
        }
    }
};
gdjs.EventsContext.prototype.clearEventsObjectsMap = function() {
    if (this._currentObjectsMap === this._objectsMapCache.length) this._objectsMapCache.push(new Hashtable);
    this._objectsMapCache[this._currentObjectsMap].clear();
    return this
};
gdjs.EventsContext.prototype.addObjectsToEventsMap = function(name, objectList) {
    this._objectsMapCache[this._currentObjectsMap].put(name, objectList);
    return this
};
gdjs.EventsContext.prototype.getEventsObjectsMap = function() {
    return this._objectsMapCache[this._currentObjectsMap++]
};
gdjs.RuntimeBehavior = function(runtimeScene, behaviorData, owner) {
    this.name = behaviorData.name || "";
    this.type = behaviorData.type || "";
    this._nameId = gdjs.RuntimeObject.getNameIdentifier(this.name);
    this._activated = true;
    this.owner = owner
};
gdjs.RuntimeBehavior.prototype.getName = function() {
    return this.name
};
gdjs.RuntimeBehavior.prototype.getNameId = function() {
    return this._nameId
};
gdjs.RuntimeBehavior.prototype.stepPreEvents = function(runtimeScene) {
    if (this._activated) this.doStepPreEvents(runtimeScene)
};
gdjs.RuntimeBehavior.prototype.stepPostEvents = function(runtimeScene) {
    if (this._activated) this.doStepPostEvents(runtimeScene)
};
gdjs.RuntimeBehavior.prototype.activate = function(enable) {
    if (enable === undefined) enable = true;
    if (!this._activated && enable) {
        this._activated = true;
        this.onActivate()
    } else if (this._activated && !enable) {
        this._activated = false;
        this.onDeActivate()
    }
};
gdjs.RuntimeBehavior.prototype.activated = function() {
    return this._activated
};
gdjs.RuntimeBehavior.prototype.onActivate = function() {};
gdjs.RuntimeBehavior.prototype.onDeActivate = function() {};
gdjs.RuntimeBehavior.prototype.doStepPreEvents = function(runtimeScene) {};
gdjs.RuntimeBehavior.prototype.doStepPostEvents = function(runtimeScene) {};
gdjs.RuntimeBehavior.prototype.ownerRemovedFromScene = function() {};
gdjs.RuntimeBehavior.thisIsARuntimeBehaviorConstructor = "";
gdjs.SpriteAnimationFrame = function(imageManager, frameData) {
    this.image = frameData ? frameData.image : "";
    this.texture = gdjs.SpriteRuntimeObjectRenderer.getAnimationFrame(imageManager, this.image);
    if (this.center === undefined) this.center = {
        x: 0,
        y: 0
    };
    if (this.origin === undefined) this.origin = {
        x: 0,
        y: 0
    };
    this.hasCustomHitBoxes = false;
    if (this.customHitBoxes === undefined) this.customHitBoxes = [];
    if (this.points === undefined) this.points = new Hashtable;
    else this.points.clear();
    for (var i = 0, len = frameData.points.length; i < len; ++i) {
        var ptData = frameData.points[i];
        var point = {
            x: parseFloat(ptData.x),
            y: parseFloat(ptData.y)
        };
        this.points.put(ptData.name, point)
    }
    var origin = frameData.originPoint;
    this.origin.x = parseFloat(origin.x);
    this.origin.y = parseFloat(origin.y);
    var center = frameData.centerPoint;
    if (center.automatic !== true) {
        this.center.x = parseFloat(center.x);
        this.center.y = parseFloat(center.y)
    } else {
        this.center.x = gdjs.SpriteRuntimeObjectRenderer.getAnimationFrameWidth(this.texture) / 2;
        this.center.y = gdjs.SpriteRuntimeObjectRenderer.getAnimationFrameHeight(this.texture) / 2
    }
    if (frameData.hasCustomCollisionMask) {
        this.hasCustomHitBoxes = true;
        for (var i = 0, len = frameData.customCollisionMask.length; i < len; ++i) {
            var polygonData = frameData.customCollisionMask[i];
            if (i >= this.customHitBoxes.length) this.customHitBoxes.push(new gdjs.Polygon);
            for (var j = 0, len2 = polygonData.length; j < len2; ++j) {
                var pointData = polygonData[j];
                if (j >= this.customHitBoxes[i].vertices.length) this.customHitBoxes[i].vertices.push([0, 0]);
                this.customHitBoxes[i].vertices[j][0] = parseFloat(pointData.x, 10);
                this.customHitBoxes[i].vertices[j][1] = parseFloat(pointData.y, 10)
            }
            this.customHitBoxes[i].vertices.length = j
        }
        this.customHitBoxes.length = i
    } else {
        this.customHitBoxes.length = 0
    }
};
gdjs.SpriteAnimationFrame.prototype.getPoint = function(name) {
    if (name == "Centre") return this.center;
    else if (name == "Origin") return this.origin;
    return this.points.containsKey(name) ? this.points.get(name) : this.origin
};
gdjs.SpriteAnimationDirection = function(imageManager, directionData) {
    this.timeBetweenFrames = directionData ? parseFloat(directionData.timeBetweenFrames) : 1;
    this.loop = !!directionData.looping;
    if (this.frames === undefined) this.frames = [];
    for (var i = 0, len = directionData.sprites.length; i < len; ++i) {
        var frameData = directionData.sprites[i];
        if (i < this.frames.length) gdjs.SpriteAnimationFrame.call(this.frames[i], imageManager, frameData);
        else this.frames.push(new gdjs.SpriteAnimationFrame(imageManager, frameData))
    }
    this.frames.length = i
};
gdjs.SpriteAnimation = function(imageManager, animData) {
    this.hasMultipleDirections = !!animData.useMultipleDirections;
    this.name = animData.name || "";
    if (this.directions === undefined) this.directions = [];
    for (var i = 0, len = animData.directions.length; i < len; ++i) {
        var directionData = animData.directions[i];
        if (i < this.directions.length) gdjs.SpriteAnimationDirection.call(this.directions[i], imageManager, directionData);
        else this.directions.push(new gdjs.SpriteAnimationDirection(imageManager, directionData))
    }
    this.directions.length = i
};
gdjs.SpriteRuntimeObject = function(runtimeScene, objectData) {
    gdjs.RuntimeObject.call(this, runtimeScene, objectData);
    this._currentAnimation = 0;
    this._currentDirection = 0;
    this._currentFrame = 0;
    this._frameElapsedTime = 0;
    this._animationSpeedScale = 1;
    this._animationPaused = false;
    this._scaleX = 1;
    this._scaleY = 1;
    this._blendMode = 0;
    this._flippedX = false;
    this._flippedY = false;
    this.opacity = 255;
    if (this._animations === undefined) this._animations = [];
    for (var i = 0, len = objectData.animations.length; i < len; ++i) {
        var animData = objectData.animations[i];
        if (i < this._animations.length) gdjs.SpriteAnimation.call(this._animations[i], runtimeScene.getGame().getImageManager(), animData);
        else this._animations.push(new gdjs.SpriteAnimation(runtimeScene.getGame().getImageManager(), animData))
    }
    this._animations.length = i;
    this._animationFrame = null;
    if (this._renderer) gdjs.SpriteRuntimeObjectRenderer.call(this._renderer, this, runtimeScene);
    else this._renderer = new gdjs.SpriteRuntimeObjectRenderer(this, runtimeScene);
    this._updateFrame()
};
gdjs.SpriteRuntimeObject.prototype = Object.create(gdjs.RuntimeObject.prototype);
gdjs.SpriteRuntimeObject.thisIsARuntimeObjectConstructor = "Sprite";
gdjs.SpriteRuntimeObject.prototype.extraInitializationFromInitialInstance = function(initialInstanceData) {
    if (initialInstanceData.numberProperties) {
        for (var i = 0, len = initialInstanceData.numberProperties.length; i < len; ++i) {
            var extraData = initialInstanceData.numberProperties[i];
            if (extraData.name === "animation") this.setAnimation(extraData.value)
        }
    }
    if (initialInstanceData.customSize) {
        this.setWidth(initialInstanceData.width);
        this.setHeight(initialInstanceData.height)
    }
};
gdjs.SpriteRuntimeObject.prototype.updateTime = function(elapsedTime) {
    var oldFrame = this._currentFrame;
    this._frameElapsedTime += this._animationPaused ? 0 : elapsedTime * this._animationSpeedScale;
    if (this._currentAnimation >= this._animations.length || this._currentDirection >= this._animations[this._currentAnimation].directions.length) {
        return
    }
    var direction = this._animations[this._currentAnimation].directions[this._currentDirection];
    if (this._frameElapsedTime > direction.timeBetweenFrames) {
        var count = Math.floor(this._frameElapsedTime / direction.timeBetweenFrames);
        this._currentFrame += count;
        this._frameElapsedTime = this._frameElapsedTime - count * direction.timeBetweenFrames;
        if (this._frameElapsedTime < 0) this._frameElapsedTime = 0
    }
    if (this._currentFrame >= direction.frames.length) {
        this._currentFrame = direction.loop ? this._currentFrame % direction.frames.length : direction.frames.length - 1
    }
    if (this._currentFrame < 0) this._currentFrame = 0;
    if (oldFrame != this._currentFrame || this._frameDirty) this._updateFrame();
    if (oldFrame != this._currentFrame) this.hitBoxesDirty = true;
    this._renderer.ensureUpToDate()
};
gdjs.SpriteRuntimeObject.prototype._updateFrame = function() {
    this._frameDirty = false;
    if (this._currentAnimation < this._animations.length && this._currentDirection < this._animations[this._currentAnimation].directions.length) {
        var direction = this._animations[this._currentAnimation].directions[this._currentDirection];
        if (this._currentFrame < direction.frames.length) {
            this._animationFrame = direction.frames[this._currentFrame];
            if (this._animationFrame !== null) {
                this._renderer.updateFrame(this._animationFrame)
            }
            return
        }
    }
    this._animationFrame = null
};
gdjs.SpriteRuntimeObject.prototype.getRendererObject = function() {
    return this._renderer.getRendererObject()
};
gdjs.SpriteRuntimeObject.prototype.updateHitBoxes = function() {
    if (this._frameDirty) this._updateFrame();
    if (this._animationFrame === null) return;
    if (!this._animationFrame.hasCustomHitBoxes) return gdjs.RuntimeObject.prototype.updateHitBoxes.call(this);
    for (var i = 0; i < this._animationFrame.customHitBoxes.length; ++i) {
        if (i >= this.hitBoxes.length) this.hitBoxes.push(new gdjs.Polygon);
        for (var j = 0; j < this._animationFrame.customHitBoxes[i].vertices.length; ++j) {
            if (j >= this.hitBoxes[i].vertices.length) this.hitBoxes[i].vertices.push([0, 0]);
            this._transformToGlobal(this._animationFrame.customHitBoxes[i].vertices[j][0], this._animationFrame.customHitBoxes[i].vertices[j][1], this.hitBoxes[i].vertices[j])
        }
        this.hitBoxes[i].vertices.length = this._animationFrame.customHitBoxes[i].vertices.length
    }
    this.hitBoxes.length = this._animationFrame.customHitBoxes.length
};
gdjs.SpriteRuntimeObject.prototype.setAnimation = function(newAnimation) {
    newAnimation = newAnimation | 0;
    if (newAnimation < this._animations.length && this._currentAnimation !== newAnimation && newAnimation >= 0) {
        this._currentAnimation = newAnimation;
        this._currentFrame = 0;
        this._frameElapsedTime = 0;
        this._renderer.update();
        this._frameDirty = true;
        this.hitBoxesDirty = true
    }
};
gdjs.SpriteRuntimeObject.prototype.setAnimationName = function(newAnimationName) {
    if (!newAnimationName) return;
    for (var i = 0; i < this._animations.length; ++i) {
        if (this._animations[i].name === newAnimationName) {
            return this.setAnimation(i)
        }
    }
};
gdjs.SpriteRuntimeObject.prototype.getAnimation = function() {
    return this._currentAnimation
};
gdjs.SpriteRuntimeObject.prototype.getAnimationName = function() {
    if (this._currentAnimation >= this._animations.length) {
        return ""
    }
    return this._animations[this._currentAnimation].name
};
gdjs.SpriteRuntimeObject.prototype.isCurrentAnimationName = function(name) {
    return this.getAnimationName() === name
};
gdjs.SpriteRuntimeObject.prototype.setDirectionOrAngle = function(newValue) {
    if (this._currentAnimation >= this._animations.length) {
        return
    }
    var anim = this._animations[this._currentAnimation];
    if (!anim.hasMultipleDirections) {
        if (this.angle === newValue) return;
        this.angle = newValue;
        this.hitBoxesDirty = true;
        this._renderer.updateAngle()
    } else {
        newValue = newValue | 0;
        if (newValue === this._currentDirection || newValue >= anim.directions.length || anim.directions[newValue].frames.length === 0 || this._currentDirection === newValue) return;
        this._currentDirection = newValue;
        this._currentFrame = 0;
        this._frameElapsedTime = 0;
        this.angle = 0;
        this._renderer.update();
        this._frameDirty = true;
        this.hitBoxesDirty = true
    }
};
gdjs.SpriteRuntimeObject.prototype.getDirectionOrAngle = function() {
    if (this._currentAnimation >= this._animations.length) {
        return 0
    }
    if (!this._animations[this._currentAnimation].hasMultipleDirections) {
        return this.angle
    } else {
        return this._currentDirection
    }
};
gdjs.SpriteRuntimeObject.prototype.setAnimationFrame = function(newFrame) {
    if (this._currentAnimation >= this._animations.length || this._currentDirection >= this._animations[this._currentAnimation].directions.length) {
        return
    }
    var direction = this._animations[this._currentAnimation].directions[this._currentDirection];
    if (newFrame >= 0 && newFrame < direction.frames.length && newFrame != this._currentFrame) {
        this._currentFrame = newFrame;
        this._frameDirty = true;
        this.hitBoxesDirty = true
    }
};
gdjs.SpriteRuntimeObject.prototype.getAnimationFrame = function() {
    return this._currentFrame
};
gdjs.SpriteRuntimeObject.prototype.hasAnimationEnded = function() {
    if (this._currentAnimation >= this._animations.length || this._currentDirection >= this._animations[this._currentAnimation].directions.length) {
        return true
    }
    if (this._animations[this._currentAnimation].loop) return false;
    var direction = this._animations[this._currentAnimation].directions[this._currentDirection];
    return this._currentFrame == direction.frames.length - 1
};
gdjs.SpriteRuntimeObject.prototype.animationPaused = function() {
    return this._animationPaused
};
gdjs.SpriteRuntimeObject.prototype.pauseAnimation = function() {
    this._animationPaused = true
};
gdjs.SpriteRuntimeObject.prototype.playAnimation = function() {
    this._animationPaused = false
};
gdjs.SpriteRuntimeObject.prototype.getAnimationSpeedScale = function() {
    return this._animationSpeedScale
};
gdjs.SpriteRuntimeObject.prototype.setAnimationSpeedScale = function(ratio) {
    this._animationSpeedScale = ratio
};
gdjs.SpriteRuntimeObject.prototype.getPointX = function(name) {
    if (name.length === 0 || this._animationFrame === null) return this.getX();
    var pt = this._animationFrame.getPoint(name);
    var pos = gdjs.staticArray(gdjs.SpriteRuntimeObject.prototype.getPointX);
    this._transformToGlobal(pt.x, pt.y, pos);
    return pos[0]
};
gdjs.SpriteRuntimeObject.prototype.getPointY = function(name) {
    if (name.length === 0 || this._animationFrame === null) return this.getY();
    var pt = this._animationFrame.getPoint(name);
    var pos = gdjs.staticArray(gdjs.SpriteRuntimeObject.prototype.getPointY);
    this._transformToGlobal(pt.x, pt.y, pos);
    return pos[1]
};
gdjs.SpriteRuntimeObject.prototype._transformToGlobal = function(x, y, result) {
    var cx = this._animationFrame.center.x;
    var cy = this._animationFrame.center.y;
    if (this._flippedX) {
        x = this._renderer.getUnscaledWidth() - x;
        cx = this._renderer.getUnscaledWidth() - cx
    }
    if (this._flippedY) {
        y = this._renderer.getUnscaledHeight() - y;
        cy = this._renderer.getUnscaledHeight() - cy
    }
    x *= Math.abs(this._scaleX);
    y *= Math.abs(this._scaleY);
    cx *= Math.abs(this._scaleX);
    cy *= Math.abs(this._scaleY);
    var oldX = x;
    x = cx + Math.cos(this.angle / 180 * 3.14159) * (x - cx) - Math.sin(this.angle / 180 * 3.14159) * (y - cy);
    y = cy + Math.sin(this.angle / 180 * 3.14159) * (oldX - cx) + Math.cos(this.angle / 180 * 3.14159) * (y - cy);
    result.length = 2;
    result[0] = x + this.getDrawableX();
    result[1] = y + this.getDrawableY()
};
gdjs.SpriteRuntimeObject.prototype.getDrawableX = function() {
    if (this._animationFrame === null) return this.x;
    return this.x - this._animationFrame.origin.x * Math.abs(this._scaleX)
};
gdjs.SpriteRuntimeObject.prototype.getDrawableY = function() {
    if (this._animationFrame === null) return this.y;
    return this.y - this._animationFrame.origin.y * Math.abs(this._scaleY)
};
gdjs.SpriteRuntimeObject.prototype.getCenterX = function() {
    if (this._animationFrame === null) return 0;
    return this._animationFrame.center.x * Math.abs(this._scaleX)
};
gdjs.SpriteRuntimeObject.prototype.getCenterY = function() {
    if (this._animationFrame === null) return 0;
    return this._animationFrame.center.y * Math.abs(this._scaleY)
};
gdjs.SpriteRuntimeObject.prototype.setX = function(x) {
    if (x === this.x) return;
    this.x = x;
    if (this._animationFrame !== null) {
        this.hitBoxesDirty = true;
        this._renderer.updateX()
    }
};
gdjs.SpriteRuntimeObject.prototype.setY = function(y) {
    if (y === this.y) return;
    this.y = y;
    if (this._animationFrame !== null) {
        this.hitBoxesDirty = true;
        this._renderer.updateY()
    }
};
gdjs.SpriteRuntimeObject.prototype.setAngle = function(angle) {
    if (this._currentAnimation >= this._animations.length) {
        return
    }
    if (!this._animations[this._currentAnimation].hasMultipleDirections) {
        if (this.angle === angle) return;
        this.angle = angle;
        this._renderer.updateAngle();
        this.hitBoxesDirty = true
    } else {
        angle = angle % 360;
        if (angle < 0) angle += 360;
        this.setDirectionOrAngle(Math.round(angle / 45) % 8)
    }
};
gdjs.SpriteRuntimeObject.prototype.getAngle = function(angle) {
    if (this._currentAnimation >= this._animations.length) {
        return 0
    }
    if (!this._animations[this._currentAnimation].hasMultipleDirections) return this.angle;
    else return this._currentDirection * 45
};
gdjs.SpriteRuntimeObject.prototype.setBlendMode = function(newMode) {
    this._blendMode = newMode;
    this._renderer.update()
};
gdjs.SpriteRuntimeObject.prototype.getBlendMode = function() {
    return this._blendMode
};
gdjs.SpriteRuntimeObject.prototype.setOpacity = function(opacity) {
    if (opacity < 0) opacity = 0;
    if (opacity > 255) opacity = 255;
    this.opacity = opacity;
    this._renderer.updateOpacity()
};
gdjs.SpriteRuntimeObject.prototype.getOpacity = function() {
    return this.opacity
};
gdjs.SpriteRuntimeObject.prototype.hide = function(enable) {
    if (enable === undefined) enable = true;
    this.hidden = enable;
    this._renderer.updateVisibility()
};
gdjs.SpriteRuntimeObject.prototype.setColor = function(rgbColor) {
    this._renderer.setColor(rgbColor)
};
gdjs.SpriteRuntimeObject.prototype.flipX = function(enable) {
    if (enable !== this._flippedX) {
        this._scaleX *= -1;
        this._flippedX = enable;
        this._renderer.update()
    }
};
gdjs.SpriteRuntimeObject.prototype.flipY = function(enable) {
    if (enable !== this._flippedY) {
        this._scaleY *= -1;
        this._flippedY = enable;
        this._renderer.update()
    }
};
gdjs.SpriteRuntimeObject.prototype.isFlippedX = function() {
    return this._flippedX
};
gdjs.SpriteRuntimeObject.prototype.isFlippedY = function() {
    return this._flippedY
};
gdjs.SpriteRuntimeObject.prototype.getWidth = function() {
    return this._renderer.getWidth()
};
gdjs.SpriteRuntimeObject.prototype.getHeight = function() {
    return this._renderer.getHeight()
};
gdjs.SpriteRuntimeObject.prototype.setWidth = function(newWidth) {
    if (this._frameDirty) this._updateFrame();
    var unscaledWidth = this._renderer.getUnscaledWidth();
    if (unscaledWidth !== 0) this.setScaleX(newWidth / unscaledWidth)
};
gdjs.SpriteRuntimeObject.prototype.setHeight = function(newHeight) {
    if (this._frameDirty) this._updateFrame();
    var unscaledHeight = this._renderer.getUnscaledHeight();
    if (unscaledHeight !== 0) this.setScaleY(newHeight / unscaledHeight)
};
gdjs.SpriteRuntimeObject.prototype.setScale = function(newScale) {
    if (newScale === Math.abs(this._scaleX) && newScale === Math.abs(this._scaleY)) return;
    if (newScale < 0) newScale = 0;
    this._scaleX = newScale * (this._flippedX ? -1 : 1);
    this._scaleY = newScale * (this._flippedY ? -1 : 1);
    this._renderer.update();
    this.hitBoxesDirty = true
};
gdjs.SpriteRuntimeObject.prototype.setScaleX = function(newScale) {
    if (newScale === Math.abs(this._scaleX)) return;
    if (newScale < 0) newScale = 0;
    this._scaleX = newScale * (this._flippedX ? -1 : 1);
    this._renderer.update();
    this.hitBoxesDirty = true
};
gdjs.SpriteRuntimeObject.prototype.setScaleY = function(newScale) {
    if (newScale === Math.abs(this._scaleY)) return;
    if (newScale < 0) newScale = 0;
    this._scaleY = newScale * (this._flippedY ? -1 : 1);
    this._renderer.update();
    this.hitBoxesDirty = true
};
gdjs.SpriteRuntimeObject.prototype.getScale = function() {
    return (Math.abs(this._scaleX) + Math.abs(this._scaleY)) / 2
};
gdjs.SpriteRuntimeObject.prototype.getScaleY = function() {
    return Math.abs(this._scaleY)
};
gdjs.SpriteRuntimeObject.prototype.getScaleX = function() {
    return Math.abs(this._scaleX)
};
gdjs.SpriteRuntimeObject.prototype.turnTowardObject = function(obj, scene) {
    if (obj === null) return;
    this.rotateTowardPosition(obj.getDrawableX() + obj.getCenterX(), obj.getDrawableY() + obj.getCenterY(), 0, scene)
};
gdjs.evtTools.common = gdjs.evtTools.common || {};
gdjs.evtTools.common.getVariableNumber = function(variable) {
    return variable.getAsNumber()
};
gdjs.evtTools.common.getVariableString = function(variable) {
    return variable.getAsString()
};
gdjs.evtTools.common.sceneVariableExists = function(runtimeScene, variableName) {
    return runtimeScene.getVariables().has(variableName)
};
gdjs.evtTools.common.globalVariableExists = function(runtimeScene, variableName) {
    return runtimeScene.getGame().getVariables().has(variableName)
};
gdjs.evtTools.common.variableChildExists = function(variable, childName) {
    return variable.hasChild(childName)
};
gdjs.evtTools.common.variableRemoveChild = function(variable, childName) {
    return variable.removeChild(childName)
};
gdjs.evtTools.common.getVariableChildCount = function(variable) {
    if (variable.isStructure() == false) return 0;
    return Object.keys(variable.getAllChildren()).length
};
gdjs.evtTools.common.toNumber = function(str) {
    return parseFloat(str)
};
gdjs.evtTools.common.toString = function(num) {
    return num.toString()
};
gdjs.evtTools.common.logicalNegation = function(bool) {
    return !bool
};
gdjs.evtTools.common.acosh = function(arg) {
    return Math.log(arg + Math.sqrt(arg * arg - 1))
};
gdjs.evtTools.common.asinh = function(arg) {
    return Math.log(arg + Math.sqrt(arg * arg + 1))
};
gdjs.evtTools.common.atanh = function(arg) {
    return .5 * Math.log((1 + arg) / (1 - arg))
};
gdjs.evtTools.common.cosh = function(arg) {
    return (Math.exp(arg) + Math.exp(-arg)) / 2
};
gdjs.evtTools.common.sinh = function(arg) {
    return (Math.exp(arg) - Math.exp(-arg)) / 2
};
gdjs.evtTools.common.tanh = function(arg) {
    return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg))
};
gdjs.evtTools.common.cot = function(arg) {
    return 1 / Math.tan(arg)
};
gdjs.evtTools.common.csc = function(arg) {
    return 1 / Math.sin(arg)
};
gdjs.evtTools.common.sec = function(arg) {
    return 1 / Math.cos(arg)
};
gdjs.evtTools.common.log10 = function(arg) {
    return Math.log(arg) / Math.LN10
};
gdjs.evtTools.common.log2 = function(arg) {
    return Math.log(arg) / Math.LN2
};
gdjs.evtTools.common.sign = function(arg) {
    if (arg === 0) return 0;
    return arg > 0 ? +1 : -1
};
gdjs.evtTools.common.cbrt = function(x) {
    return Math.pow(x, 1 / 3)
};
gdjs.evtTools.common.nthroot = function(x, n) {
    return Math.pow(x, 1 / n)
};
gdjs.evtTools.common.mod = function(x, y) {
    return x - y * Math.floor(x / y)
};
gdjs.evtTools.common.angleDifference = function(angle1, angle2) {
    return gdjs.evtTools.common.mod(gdjs.evtTools.common.mod(angle1 - angle2, 360) + 180, 360) - 180
};
gdjs.evtTools.common.lerp = function(a, b, x) {
    return a + (b - a) * x
};
gdjs.evtTools.common.trunc = function(x) {
    return x | 0
};
gdjs.evtTools.runtimeScene = gdjs.evtTools.runtimeScene || {};
gdjs.evtTools.runtimeScene.sceneJustBegins = function(runtimeScene) {
    return runtimeScene.getTimeManager().isFirstFrame()
};
gdjs.evtTools.runtimeScene.getSceneName = function(runtimeScene) {
    return runtimeScene.getName()
};
gdjs.evtTools.runtimeScene.setBackgroundColor = function(runtimeScene, rgbColor) {
    var colors = rgbColor.split(";");
    if (colors.length < 3) return;
    runtimeScene.setBackgroundColor(parseInt(colors[0]), parseInt(colors[1]), parseInt(colors[2]))
};
gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds = function(runtimeScene) {
    return runtimeScene.getTimeManager().getElapsedTime() / 1e3
};
gdjs.evtTools.runtimeScene.setTimeScale = function(runtimeScene, timeScale) {
    return runtimeScene.getTimeManager().setTimeScale(timeScale)
};
gdjs.evtTools.runtimeScene.getTimeScale = function(runtimeScene) {
    return runtimeScene.getTimeManager().getTimeScale()
};
gdjs.evtTools.runtimeScene.timerElapsedTime = function(runtimeScene, timeInSeconds, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    if (!timeManager.hasTimer(timerName)) {
        timeManager.addTimer(timerName);
        return false
    }
    return timeManager.getTimer(timerName).getTime() / 1e3 >= timeInSeconds
};
gdjs.evtTools.runtimeScene.timerPaused = function(runtimeScene, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    if (!timeManager.hasTimer(timerName)) return false;
    return timeManager.getTimer(timerName).isPaused()
};
gdjs.evtTools.runtimeScene.resetTimer = function(runtimeScene, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    if (!timeManager.hasTimer(timerName)) timeManager.addTimer(timerName);
    else timeManager.getTimer(timerName).reset()
};
gdjs.evtTools.runtimeScene.pauseTimer = function(runtimeScene, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    if (!timeManager.hasTimer(timerName)) timeManager.addTimer(timerName);
    timeManager.getTimer(timerName).setPaused(true)
};
gdjs.evtTools.runtimeScene.unpauseTimer = function(runtimeScene, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    if (!timeManager.hasTimer(timerName)) timeManager.addTimer(timerName);
    return timeManager.getTimer(timerName).setPaused(false)
};
gdjs.evtTools.runtimeScene.removeTimer = function(runtimeScene, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    timeManager.removeTimer(timerName)
};
gdjs.evtTools.runtimeScene.getTimerElapsedTimeInSeconds = function(runtimeScene, timerName) {
    var timeManager = runtimeScene.getTimeManager();
    if (!timeManager.hasTimer(timerName)) return 0;
    return timeManager.getTimer(timerName).getTime() / 1e3
};
gdjs.evtTools.runtimeScene.getTimeFromStartInSeconds = function(runtimeScene) {
    return runtimeScene.getTimeManager().getTimeFromStart() / 1e3
};
gdjs.evtTools.runtimeScene.getTime = function(runtimeScene, what) {
    var now = new Date;
    if (what === "hour") return now.getHours();
    else if (what === "min") return now.getMinutes();
    else if (what === "sec") return now.getSeconds();
    else if (what === "mday") return now.getdate();
    else if (what === "mon") return now.getMonth();
    else if (what === "year") return now.getFullYear() - 1900;
    else if (what === "wday") return now.getday();
    else if (what === "yday") {
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1e3 * 60 * 60 * 24;
        return Math.floor(diff / oneDay)
    }
    return 0
};
gdjs.evtTools.runtimeScene.replaceScene = function(runtimeScene, newSceneName, clearOthers) {
    if (!runtimeScene.getGame().getSceneData(newSceneName)) return;
    runtimeScene.requestChange(clearOthers ? gdjs.RuntimeScene.CLEAR_SCENES : gdjs.RuntimeScene.REPLACE_SCENE, newSceneName)
};
gdjs.evtTools.runtimeScene.pushScene = function(runtimeScene, newSceneName) {
    if (!runtimeScene.getGame().getSceneData(newSceneName)) return;
    runtimeScene.requestChange(gdjs.RuntimeScene.PUSH_SCENE, newSceneName)
};
gdjs.evtTools.runtimeScene.popScene = function(runtimeScene) {
    runtimeScene.requestChange(gdjs.RuntimeScene.POP_SCENE)
};
gdjs.evtTools.runtimeScene.stopGame = function(runtimeScene) {
    runtimeScene.requestChange(gdjs.RuntimeScene.STOP_GAME)
};
gdjs.evtTools.runtimeScene.createObjectsFromExternalLayout = function(scene, externalLayout, xPos, yPos) {
    var externalLayoutData = scene.getGame().getExternalLayoutData(externalLayout);
    if (externalLayoutData === null) return;
    scene.createObjectsFrom(externalLayoutData.instances, xPos, yPos)
};
gdjs.evtTools.input = gdjs.evtTools.input || {};
gdjs.evtTools.input.isKeyPressed = function(runtimeScene, key) {
    if (gdjs.evtTools.input.keysNameToCode.hasOwnProperty(key)) {
        return runtimeScene.getGame().getInputManager().isKeyPressed(gdjs.evtTools.input.keysNameToCode[key])
    }
    return false
};
gdjs.evtTools.input.wasKeyReleased = function(runtimeScene, key) {
    if (gdjs.evtTools.input.keysNameToCode.hasOwnProperty(key)) {
        return runtimeScene.getGame().getInputManager().wasKeyReleased(gdjs.evtTools.input.keysNameToCode[key])
    }
    return false
};
gdjs.evtTools.input.lastPressedKey = function(runtimeScene) {
    if (gdjs.evtTools.input._keysCodeToName === undefined) {
        gdjs.evtTools.input._keysCodeToName = {};
        var keysNameToCode = gdjs.evtTools.input.keysNameToCode;
        for (var p in keysNameToCode) {
            if (keysNameToCode.hasOwnProperty(p)) {
                gdjs.evtTools.input._keysCodeToName[keysNameToCode[p]] = p
            }
        }
    }
    var keyCode = runtimeScene.getGame().getInputManager().getLastPressedKey();
    if (gdjs.evtTools.input._keysCodeToName.hasOwnProperty(keyCode)) {
        return gdjs.evtTools.input._keysCodeToName[keyCode]
    }
    return ""
};
gdjs.evtTools.input.keysNameToCode = {
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    Numpad0: 96,
    Numpad1: 97,
    Numpad2: 98,
    Numpad3: 99,
    Numpad4: 100,
    Numpad5: 101,
    Numpad6: 102,
    Numpad7: 103,
    Numpad8: 104,
    Numpad9: 105,
    RControl: 17,
    RShift: 16,
    RAlt: 18,
    LControl: 17,
    LShift: 1,
    LAlt: 18,
    LSystem: 91,
    RSystem: 91,
    Space: 32,
    Return: 13,
    Back: 8,
    Tab: 9,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    Delete: 46,
    Insert: 45,
    Add: 107,
    Subtract: 109,
    Multiply: 106,
    Divide: 111,
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    Pause: 19
};
gdjs.evtTools.input.anyKeyPressed = function(runtimeScene) {
    return runtimeScene.getGame().getInputManager().anyKeyPressed()
};
gdjs.evtTools.input.isMouseButtonPressed = function(runtimeScene, button) {
    if (button === "Left") return runtimeScene.getGame().getInputManager().isMouseButtonPressed(0);
    if (button === "Right") return runtimeScene.getGame().getInputManager().isMouseButtonPressed(1);
    return false
};
gdjs.evtTools.input.isMouseButtonReleased = function(runtimeScene, button) {
    if (button === "Left") return runtimeScene.getGame().getInputManager().isMouseButtonReleased(0);
    if (button === "Right") return runtimeScene.getGame().getInputManager().isMouseButtonReleased(1);
    return false
};
gdjs.evtTools.input.hideCursor = function(runtimeScene) {
    runtimeScene.getRenderer().hideCursor()
};
gdjs.evtTools.input.showCursor = function(runtimeScene) {
    runtimeScene.getRenderer().showCursor()
};
gdjs.evtTools.input.getMouseWheelDelta = function(runtimeScene) {
    return runtimeScene.getGame().getInputManager().getMouseWheelDelta()
};
gdjs.evtTools.input.getMouseX = function(runtimeScene, layer, camera) {
    return runtimeScene.getLayer(layer).convertCoords(runtimeScene.getGame().getInputManager().getMouseX(), runtimeScene.getGame().getInputManager().getMouseY())[0]
};
gdjs.evtTools.input.getMouseY = function(runtimeScene, layer, camera) {
    return runtimeScene.getLayer(layer).convertCoords(runtimeScene.getGame().getInputManager().getMouseX(), runtimeScene.getGame().getInputManager().getMouseY())[1]
};
gdjs.evtTools.input._cursorIsOnObject = function(obj, runtimeScene) {
    return obj.cursorOnObject(runtimeScene)
};
gdjs.evtTools.input.cursorOnObject = function(objectsLists, runtimeScene, accurate, inverted) {
    return gdjs.evtTools.object.pickObjectsIf(gdjs.evtTools.input._cursorIsOnObject, objectsLists, inverted, runtimeScene)
};
gdjs.evtTools.input.getTouchX = function(runtimeScene, identifier, layer, camera) {
    return runtimeScene.getLayer(layer).convertCoords(runtimeScene.getGame().getInputManager().getTouchX(identifier), runtimeScene.getGame().getInputManager().getTouchY(identifier))[0]
};
gdjs.evtTools.input.getTouchY = function(runtimeScene, identifier, layer, camera) {
    return runtimeScene.getLayer(layer).convertCoords(runtimeScene.getGame().getInputManager().getTouchX(identifier), runtimeScene.getGame().getInputManager().getTouchY(identifier))[1]
};
gdjs.evtTools.input.getLastTouchId = function() {
    return gdjs.evtTools.input.lastTouchId || 0
};
gdjs.evtTools.input.getLastEndedTouchId = function() {
    return gdjs.evtTools.input.lastEndedTouchId || 0
};
gdjs.evtTools.input.popStartedTouch = function(runtimeScene) {
    var startedTouchId = runtimeScene.getGame().getInputManager().popStartedTouch();
    if (startedTouchId !== undefined) {
        gdjs.evtTools.input.lastTouchId = startedTouchId;
        return true
    }
    return false
};
gdjs.evtTools.input.popEndedTouch = function(runtimeScene) {
    var endedTouchId = runtimeScene.getGame().getInputManager().popEndedTouch();
    if (endedTouchId !== undefined) {
        gdjs.evtTools.input.lastEndedTouchId = endedTouchId;
        return true
    }
    return false
};
gdjs.evtTools.input.touchSimulateMouse = function(runtimeScene, enable) {
    runtimeScene.getGame().getInputManager().touchSimulateMouse(enable)
};
gdjs.evtTools.object = gdjs.evtTools.object || {};
gdjs.evtTools.object.pickOnly = function(objectsLists, runtimeObject) {
    var lists = gdjs.staticArray(gdjs.evtTools.object.pickOnly);
    objectsLists.values(lists);
    for (var i = 0, len = lists.length; i < len; ++i) lists[i].length = 0;
    objectsLists.get(runtimeObject.getName()).push(runtimeObject)
};
gdjs.evtTools.object.twoListsTest = function(predicate, objectsLists1, objectsLists2, inverted, extraArg) {
    var isTrue = false;
    var objects1Lists = gdjs.staticArray(gdjs.evtTools.object.twoListsTest);
    objectsLists1.values(objects1Lists);
    var objects2Lists = gdjs.staticArray2(gdjs.evtTools.object.twoListsTest);
    objectsLists2.values(objects2Lists);
    for (var i = 0, leni = objects1Lists.length; i < leni; ++i) {
        var arr = objects1Lists[i];
        for (var k = 0, lenk = arr.length; k < lenk; ++k) {
            arr[k].pick = false
        }
    }
    for (var i = 0, leni = objects2Lists.length; i < leni; ++i) {
        var arr = objects2Lists[i];
        for (var k = 0, lenk = arr.length; k < lenk; ++k) {
            arr[k].pick = false
        }
    }
    for (var i = 0, leni = objects1Lists.length; i < leni; ++i) {
        var arr1 = objects1Lists[i];
        for (var k = 0, lenk = arr1.length; k < lenk; ++k) {
            var atLeastOneObject = false;
            for (var j = 0, lenj = objects2Lists.length; j < lenj; ++j) {
                var arr2 = objects2Lists[j];
                for (var l = 0, lenl = arr2.length; l < lenl; ++l) {
                    if (arr1[k].pick && arr2[l].pick) continue;
                    if (arr1[k].id !== arr2[l].id && predicate(arr1[k], arr2[l], extraArg)) {
                        if (!inverted) {
                            isTrue = true;
                            arr1[k].pick = true;
                            arr2[l].pick = true
                        }
                        atLeastOneObject = true
                    }
                }
            }
            if (!atLeastOneObject && inverted) {
                isTrue = true;
                arr1[k].pick = true
            }
        }
    }
    for (var i = 0, leni = objects1Lists.length; i < leni; ++i) {
        var arr = objects1Lists[i];
        var finalSize = 0;
        for (var k = 0, lenk = arr.length; k < lenk; ++k) {
            var obj = arr[k];
            if (arr[k].pick) {
                arr[finalSize] = obj;
                finalSize++
            }
        }
        arr.length = finalSize
    }
    if (!inverted) {
        for (var i = 0, leni = objects2Lists.length; i < leni; ++i) {
            var arr = objects2Lists[i];
            var finalSize = 0;
            for (var k = 0, lenk = arr.length; k < lenk; ++k) {
                var obj = arr[k];
                if (arr[k].pick) {
                    arr[finalSize] = obj;
                    finalSize++
                }
            }
            arr.length = finalSize
        }
    }
    return isTrue
};
gdjs.evtTools.object.pickObjectsIf = function(predicate, objectsLists, negatePredicate, extraArg) {
    var isTrue = false;
    var lists = gdjs.staticArray(gdjs.evtTools.object.pickObjectsIf);
    objectsLists.values(lists);
    for (var i = 0, leni = lists.length; i < leni; ++i) {
        var arr = lists[i];
        for (var k = 0, lenk = arr.length; k < lenk; ++k) {
            arr[k].pick = false
        }
    }
    for (var i = 0, leni = lists.length; i < leni; ++i) {
        var arr = lists[i];
        for (var k = 0, lenk = arr.length; k < lenk; ++k) {
            if (negatePredicate ^ predicate(arr[k], extraArg)) {
                isTrue = true;
                arr[k].pick = true
            }
        }
    }
    for (var i = 0, leni = lists.length; i < leni; ++i) {
        var arr = lists[i];
        var finalSize = 0;
        for (var k = 0, lenk = arr.length; k < lenk; ++k) {
            var obj = arr[k];
            if (arr[k].pick) {
                arr[finalSize] = obj;
                finalSize++
            }
        }
        arr.length = finalSize
    }
    return isTrue
};
gdjs.evtTools.object.hitBoxesCollisionTest = function(objectsLists1, objectsLists2, inverted, runtimeScene) {
    return gdjs.evtTools.object.twoListsTest(gdjs.RuntimeObject.collisionTest, objectsLists1, objectsLists2, inverted)
};
gdjs.evtTools.object._distanceBetweenObjects = function(obj1, obj2, distance) {
    return obj1.getSqDistanceToObject(obj2) <= distance
};
gdjs.evtTools.object.distanceTest = function(objectsLists1, objectsLists2, distance, inverted) {
    return gdjs.evtTools.object.twoListsTest(gdjs.evtTools.object._distanceBetweenObjects, objectsLists1, objectsLists2, inverted, distance * distance)
};
gdjs.evtTools.object._movesToward = function(obj1, obj2, tolerance) {
    if (obj1.hasNoForces()) return false;
    var objAngle = Math.atan2(obj2.getY() + obj2.getCenterY() - (obj1.getY() + obj1.getCenterY()), obj2.getX() + obj2.getCenterX() - (obj1.getX() + obj1.getCenterX()));
    objAngle *= 180 / 3.14159;
    return Math.abs(gdjs.evtTools.common.angleDifference(obj1.getAverageForce().getAngle(), objAngle)) <= tolerance / 2
};
gdjs.evtTools.object.movesTowardTest = function(objectsLists1, objectsLists2, tolerance, inverted) {
    return gdjs.evtTools.object.twoListsTest(gdjs.evtTools.object._movesToward, objectsLists1, objectsLists2, inverted, tolerance)
};
gdjs.evtTools.object._turnedToward = function(obj1, obj2, tolerance) {
    var objAngle = Math.atan2(obj2.getY() + obj2.getCenterY() - (obj1.getY() + obj1.getCenterY()), obj2.getX() + obj2.getCenterX() - (obj1.getX() + obj1.getCenterX()));
    objAngle *= 180 / 3.14159;
    return Math.abs(gdjs.evtTools.common.angleDifference(obj1.getAngle(), objAngle)) <= tolerance / 2
};
gdjs.evtTools.object.turnedTowardTest = function(objectsLists1, objectsLists2, tolerance, inverted) {
    return gdjs.evtTools.object.twoListsTest(gdjs.evtTools.object._turnedToward, objectsLists1, objectsLists2, inverted, tolerance)
};
gdjs.evtTools.object.pickAllObjects = function(runtimeScene, objectsLists) {
    for (var name in objectsLists.items) {
        if (objectsLists.items.hasOwnProperty(name)) {
            var allObjects = runtimeScene.getObjects(name);
            var objectsList = objectsLists.items[name];
            objectsList.length = 0;
            objectsList.push.apply(objectsList, allObjects)
        }
    }
    return true
};
gdjs.evtTools.object.pickRandomObject = function(runtimeScene, objectsLists) {
    var objects = gdjs.staticArray(gdjs.evtTools.object.pickRandomObject);
    objects.length = 0;
    var lists = gdjs.staticArray2(gdjs.evtTools.object.pickRandomObject);
    objectsLists.values(lists);
    for (var i = 0, len = lists.length; i < len; ++i) {
        objects.push.apply(objects, lists[i]);
        lists[i].length = 0
    }
    if (objects.length === 0) return false;
    var id = Math.floor(Math.random() * objects.length);
    if (id >= objects.length) id = objects.length - 1;
    var theChosenOne = objects[id];
    objectsLists.get(theChosenOne.getName()).push(theChosenOne);
    return true
};
gdjs.evtTools.object.pickNearestObject = function(objectsLists, x, y, inverted) {
    var bestObject = null;
    var best = 0;
    var first = true;
    var lists = gdjs.staticArray(gdjs.evtTools.object.pickNearestObject);
    objectsLists.values(lists);
    for (var i = 0, len = lists.length; i < len; ++i) {
        var list = lists[i];
        for (var j = 0; j < list.length; ++j) {
            var object = list[j];
            var distance = object.getSqDistanceTo(x, y);
            if (first || distance < best ^ inverted) {
                best = distance;
                bestObject = object
            }
            first = false
        }
    }
    if (!bestObject) return false;
    gdjs.evtTools.object.pickOnly(objectsLists, bestObject);
    return true
};
gdjs.evtTools.object.doCreateObjectOnScene = function(runtimeScene, objectName, objectsLists, x, y, layer) {
    var obj = runtimeScene.createObject(objectName);
    if (obj !== null) {
        obj.setPosition(x, y);
        obj.setLayer(layer);
        if (objectsLists.containsKey(objectName)) {
            objectsLists.get(objectName).push(obj)
        }
    }
};
gdjs.evtTools.object.createObjectOnScene = function(runtimeScene, objectsLists, x, y, layer) {
    gdjs.evtTools.object.doCreateObjectOnScene(runtimeScene, objectsLists.firstKey(), objectsLists, x, y, layer)
};
gdjs.evtTools.object.createObjectFromGroupOnScene = function(runtimeScene, objectsLists, objectName, x, y, layer) {
    gdjs.evtTools.object.doCreateObjectOnScene(runtimeScene, objectName, objectsLists, x, y, layer)
};
gdjs.evtTools.object.pickedObjectsCount = function(objectsLists) {
    var size = 0;
    var lists = gdjs.staticArray(gdjs.evtTools.object.pickedObjectsCount);
    objectsLists.values(lists);
    for (var i = 0, len = lists.length; i < len; ++i) {
        size += lists[i].length
    }
    return size
};
gdjs.evtTools.camera = gdjs.evtTools.camera || {};
gdjs.evtTools.camera.setCameraX = function(runtimeScene, x, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    runtimeScene.getLayer(layer).setCameraX(x, cameraId)
};
gdjs.evtTools.camera.setCameraY = function(runtimeScene, y, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    runtimeScene.getLayer(layer).setCameraY(y, cameraId)
};
gdjs.evtTools.camera.getCameraX = function(runtimeScene, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return 0
    }
    return runtimeScene.getLayer(layer).getCameraX()
};
gdjs.evtTools.camera.getCameraY = function(runtimeScene, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return 0
    }
    return runtimeScene.getLayer(layer).getCameraY()
};
gdjs.evtTools.camera.getCameraWidth = function(runtimeScene, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return 0
    }
    return runtimeScene.getLayer(layer).getCameraWidth()
};
gdjs.evtTools.camera.getCameraHeight = function(runtimeScene, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return 0
    }
    return runtimeScene.getLayer(layer).getCameraHeight()
};
gdjs.evtTools.camera.showLayer = function(runtimeScene, layer) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    return runtimeScene.getLayer(layer).show(true)
};
gdjs.evtTools.camera.hideLayer = function(runtimeScene, layer) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    return runtimeScene.getLayer(layer).show(false)
};
gdjs.evtTools.camera.layerIsVisible = function(runtimeScene, layer) {
    return runtimeScene.hasLayer(layer) && runtimeScene.getLayer(layer).isVisible()
};
gdjs.evtTools.camera.setCameraRotation = function(runtimeScene, rotation, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    return runtimeScene.getLayer(layer).setCameraRotation(rotation, cameraId)
};
gdjs.evtTools.camera.getCameraRotation = function(runtimeScene, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return 0
    }
    return runtimeScene.getLayer(layer).getCameraRotation(cameraId)
};
gdjs.evtTools.camera.setCameraZoom = function(runtimeScene, newZoom, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    return runtimeScene.getLayer(layer).setCameraZoom(newZoom, cameraId)
};
gdjs.evtTools.camera.centerCamera = function(runtimeScene, object, anticipateMove, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer) || object == null) {
        return
    }
    var elapsedTimeInSeconds = runtimeScene.getTimeManager().getElapsedTime() / 1e3;
    var layer = runtimeScene.getLayer(layer);
    var xOffset = 0;
    var yOffset = 0;
    if (anticipateMove && !object.hasNoForces()) {
        var objectAverageForce = object.getAverageForce();
        xOffset = objectAverageForce.getX() * elapsedTimeInSeconds;
        yOffset = objectAverageForce.getY() * elapsedTimeInSeconds
    }
    layer.setCameraX(object.getDrawableX() + object.getCenterX(), cameraId);
    layer.setCameraY(object.getDrawableY() + object.getCenterY(), cameraId)
};
gdjs.evtTools.camera.centerCameraWithinLimits = function(runtimeScene, object, left, top, right, bottom, anticipateMove, layer, cameraId) {
    if (!runtimeScene.hasLayer(layer) || object == null) {
        return
    }
    var elapsedTimeInSeconds = runtimeScene.getTimeManager().getElapsedTime() / 1e3;
    var layer = runtimeScene.getLayer(layer);
    var xOffset = 0;
    var yOffset = 0;
    if (anticipateMove && !object.hasNoForces()) {
        var objectAverageForce = object.getAverageForce();
        xOffset = objectAverageForce.getX() * elapsedTimeInSeconds;
        yOffset = objectAverageForce.getY() * elapsedTimeInSeconds
    }
    var newX = object.getDrawableX() + object.getCenterX() + xOffset;
    if (newX < left + layer.getCameraWidth(cameraId) / 2) newX = left + layer.getCameraWidth(cameraId) / 2;
    if (newX > right - layer.getCameraWidth(cameraId) / 2) newX = right - layer.getCameraWidth(cameraId) / 2;
    var newY = object.getDrawableY() + object.getCenterY() + yOffset;
    if (newY < top + layer.getCameraHeight(cameraId) / 2) newY = top + layer.getCameraHeight(cameraId) / 2;
    if (newY > bottom - layer.getCameraHeight(cameraId) / 2) newY = bottom - layer.getCameraHeight(cameraId) / 2;
    layer.setCameraX(newX, cameraId);
    layer.setCameraY(newY, cameraId)
};
gdjs.evtTools.camera.setLayerEffectParameter = function(runtimeScene, layer, effect, parameter, value) {
    if (!runtimeScene.hasLayer(layer)) {
        return
    }
    return runtimeScene.getLayer(layer).setEffectParameter(effect, parameter, value)
};
gdjs.evtTools.sound = gdjs.evtTools.sound || {};
gdjs.evtTools.sound.getGlobalVolume = function(runtimeScene) {
    return runtimeScene.getSoundManager().getGlobalVolume()
};
gdjs.evtTools.sound.setGlobalVolume = function(runtimeScene, globalVolume) {
    runtimeScene.getSoundManager().setGlobalVolume(globalVolume)
};
gdjs.evtTools.sound.playSound = function(runtimeScene, soundFile, loop, volume, pitch) {
    runtimeScene.getSoundManager().playSound(soundFile, loop, volume, pitch)
};
gdjs.evtTools.sound.playSoundOnChannel = function(runtimeScene, soundFile, channel, loop, volume, pitch) {
    runtimeScene.getSoundManager().playSoundOnChannel(soundFile, channel, loop, volume, pitch)
};
gdjs.evtTools.sound.stopSoundOnChannel = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    sound && sound.stop()
};
gdjs.evtTools.sound.pauseSoundOnChannel = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    sound && sound.pause()
};
gdjs.evtTools.sound.continueSoundOnChannel = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    sound && sound.play()
};
gdjs.evtTools.sound.isSoundOnChannelPlaying = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    return sound ? sound.playing() : false
};
gdjs.evtTools.sound.isSoundOnChannelPaused = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    return sound ? sound.paused() : false
};
gdjs.evtTools.sound.isSoundOnChannelStopped = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    return sound ? sound.stopped() : true
};
gdjs.evtTools.sound.getSoundOnChannelVolume = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    return sound ? sound.volume() * 100 : 100
};
gdjs.evtTools.sound.setSoundOnChannelVolume = function(runtimeScene, channel, volume) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    sound && sound.volume(volume / 100)
};
gdjs.evtTools.sound.getSoundOnChannelPlayingOffset = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    return sound ? sound.seek() : 0
};
gdjs.evtTools.sound.setSoundOnChannelPlayingOffset = function(runtimeScene, channel, playingOffset) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    sound && sound.seek(playingOffset)
};
gdjs.evtTools.sound.getSoundOnChannelPitch = function(runtimeScene, channel) {
    var sound = runtimeScene.getSoundManager().getSoundOnChannel(channel);
    return sound ? sound.rate() : 1
};
gdjs.evtTools.sound.playMusic = function(runtimeScene, soundFile, loop, volume, pitch) {
    runtimeScene.getSoundManager().playMusic(soundFile, loop, volume, pitch)
};
gdjs.evtTools.sound.playMusicOnChannel = function(runtimeScene, soundFile, channel, loop, volume, pitch) {
    runtimeScene.getSoundManager().playMusicOnChannel(soundFile, channel, loop, volume, pitch)
};
gdjs.evtTools.sound.stopMusicOnChannel = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    music && music.stop()
};
gdjs.evtTools.sound.pauseMusicOnChannel = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    music && music.pause()
};
gdjs.evtTools.sound.continueMusicOnChannel = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    music && music.play()
};
gdjs.evtTools.sound.isMusicOnChannelPlaying = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    return music ? music.playing() : false
};
gdjs.evtTools.sound.isMusicOnChannelPaused = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    return music ? music.paused() : false
};
gdjs.evtTools.sound.isMusicOnChannelStopped = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    return music ? music.stopped() : true
};
gdjs.evtTools.sound.getMusicOnChannelVolume = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    return music ? music.volume() * 100 : 100
};
gdjs.evtTools.sound.setMusicOnChannelVolume = function(runtimeScene, channel, volume) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    music && music.volume(volume / 100)
};
gdjs.evtTools.sound.getMusicOnChannelPlayingOffset = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    return music ? music.seek() : 0
};
gdjs.evtTools.sound.setMusicOnChannelPlayingOffset = function(runtimeScene, channel, playingOffset) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    music && music.seek(playingOffset)
};
gdjs.evtTools.sound.getMusicOnChannelPitch = function(runtimeScene, channel) {
    var music = runtimeScene.getSoundManager().getMusicOnChannel(channel);
    return music ? music.rate() : 1
};
gdjs.evtTools.storage = gdjs.evtTools.storage || {
    loadedFiles: new Hashtable,
    localStorage: typeof cc !== "undefined" ? cc.sys.localStorage : localStorage,
    fileUtils: null
};
gdjs.evtTools.storage.loadJSONFileFromStorage = function(filename) {
    if (gdjs.evtTools.storage.loadedFiles.containsKey(filename)) return;
    var rawStr = null;
    if (gdjs.evtTools.storage.fileUtils) {
        var fileUtils = gdjs.evtTools.storage.fileUtils;
        var fullPath = jsb.fileUtils.getWritablePath() + filename;
        if (jsb.fileUtils.isFileExist(fullPath)) {
            rawStr = jsb.fileUtils.getStringFromFile(fullPath)
        } else {
            console.log('File "' + filename + '" does not exist.')
        }
    } else {
        var localStorage = gdjs.evtTools.storage.localStorage;
        rawStr = localStorage.getItem("GDJS_" + filename)
    }
    try {
        if (rawStr !== null) gdjs.evtTools.storage.loadedFiles.put(filename, JSON.parse(rawStr));
        else gdjs.evtTools.storage.loadedFiles.put(filename, {})
    } catch (e) {
        console.log('Unable to load data from "' + filename + '"!');
        gdjs.evtTools.storage.loadedFiles.put(filename, {})
    }
};
gdjs.evtTools.storage.unloadJSONFile = function(filename) {
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) return;
    var jsonObject = gdjs.evtTools.storage.loadedFiles.get(filename);
    var rawStr = JSON.stringify(jsonObject);
    if (gdjs.evtTools.storage.fileUtils) {
        var fileUtils = gdjs.evtTools.storage.fileUtils;
        var fullPath = jsb.fileUtils.getWritablePath() + filename;
        if (!jsb.fileUtils.writeToFile(rawStr, fullPath)) {
            console.log('Unable to save data to file "' + filename + '"!')
        }
    } else {
        var localStorage = gdjs.evtTools.storage.localStorage;
        try {
            localStorage.setItem("GDJS_" + filename, rawStr)
        } catch (e) {
            console.log('Unable to save data to localStorage for "' + filename + '"!')
        }
    }
    gdjs.evtTools.storage.loadedFiles.remove(filename)
};
gdjs.evtTools.storage.clearJSONFile = function(filename) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var JSONobject = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var p in JSONobject) {
        if (JSONobject.hasOwnProperty(p)) delete JSONobject[p]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.storage.elementExistsInJSONFile = function(filename, element) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var elemArray = element.split("/");
    var currentElem = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var i = 0; i < elemArray.length; ++i) {
        if (!currentElem[elemArray[i]]) {
            if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
            return false
        }
        currentElem = currentElem[elemArray[i]]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.storage.deleteElementFromJSONFile = function(filename, element) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var elemArray = element.split("/");
    var currentElem = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var i = 0; i < elemArray.length; ++i) {
        if (!currentElem[elemArray[i]]) {
            if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
            return false
        }
        if (i == elemArray.length - 1) delete currentElem[elemArray[i]];
        else currentElem = currentElem[elemArray[i]]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.storage.writeNumberInJSONFile = function(filename, element, val) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var elemArray = element.split("/");
    var currentElem = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var i = 0; i < elemArray.length; ++i) {
        if (!currentElem[elemArray[i]]) currentElem[elemArray[i]] = {};
        if (i == elemArray.length - 1) currentElem[elemArray[i]].value = val;
        else currentElem = currentElem[elemArray[i]]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.storage.writeStringInJSONFile = function(filename, element, str) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var elemArray = element.split("/");
    var currentElem = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var i = 0; i < elemArray.length; ++i) {
        if (!currentElem[elemArray[i]]) currentElem[elemArray[i]] = {};
        if (i == elemArray.length - 1) currentElem[elemArray[i]].str = str;
        else currentElem = currentElem[elemArray[i]]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.storage.readNumberFromJSONFile = function(filename, element, runtimeScene, variable) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var elemArray = element.split("/");
    var currentElem = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var i = 0; i < elemArray.length; ++i) {
        if (!currentElem[elemArray[i]]) {
            if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
            return false
        }
        if (i == elemArray.length - 1 && typeof currentElem[elemArray[i]].value !== "undefined") variable.setNumber(currentElem[elemArray[i]].value);
        else currentElem = currentElem[elemArray[i]]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.storage.readStringFromJSONFile = function(filename, element, runtimeScene, variable) {
    var notPermanentlyLoaded = false;
    if (!gdjs.evtTools.storage.loadedFiles.containsKey(filename)) {
        notPermanentlyLoaded = true;
        gdjs.evtTools.storage.loadJSONFileFromStorage(filename)
    }
    var elemArray = element.split("/");
    var currentElem = gdjs.evtTools.storage.loadedFiles.get(filename);
    for (var i = 0; i < elemArray.length; ++i) {
        if (!currentElem[elemArray[i]]) {
            if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
            return false
        }
        if (i == elemArray.length - 1 && typeof currentElem[elemArray[i]].str !== "undefined") variable.setString(currentElem[elemArray[i]].str);
        else currentElem = currentElem[elemArray[i]]
    }
    if (notPermanentlyLoaded) gdjs.evtTools.storage.unloadJSONFile(filename);
    return true
};
gdjs.evtTools.string = gdjs.evtTools.string || {};
gdjs.evtTools.string.newLine = function() {
    return "\n"
};
gdjs.evtTools.string.fromCodePoint = function(codePoint) {
    return String.fromCodePoint(codePoint)
};
gdjs.evtTools.string.toUpperCase = function(str) {
    return str.toUpperCase()
};
gdjs.evtTools.string.toLowerCase = function(str) {
    return str.toLowerCase()
};
gdjs.evtTools.string.subStr = function(str, start, len) {
    if (start < str.length && start >= 0) return str.substr(start, len);
    return ""
};
gdjs.evtTools.string.strAt = function(str, start) {
    if (start < str.length && start >= 0) return str.substr(start, 1);
    return ""
};
gdjs.evtTools.string.strLen = function(str) {
    return str.length
};
gdjs.evtTools.string.strFind = function(str, what) {
    return str.indexOf(what)
};
gdjs.evtTools.string.strRFind = function(str, what) {
    return str.lastIndexOf(what)
};
gdjs.evtTools.string.strFindFrom = function(str, what, pos) {
    return str.indexOf(what, pos)
};
gdjs.evtTools.string.strRFindFrom = function(str, what, pos) {
    return str.lastIndexOf(what, pos)
};
gdjs.evtTools.window = gdjs.evtTools.window || {};
gdjs.evtTools.window.setMargins = function(runtimeScene, top, right, bottom, left) {
    runtimeScene.getGame().getRenderer().setMargins(top, right, bottom, left)
};
gdjs.evtTools.window.setFullScreen = function(runtimeScene, enable, keepAspectRatio) {
    runtimeScene.getGame().getRenderer().keepAspectRatio(keepAspectRatio);
    runtimeScene.getGame().getRenderer().setFullScreen(enable)
};
gdjs.evtTools.window.setCanvasSize = function(runtimeScene, width, height, changeDefaultSize) {
    runtimeScene.getGame().getRenderer().setSize(width, height);
    if (changeDefaultSize) {
        runtimeScene.getGame().setDefaultWidth(width);
        runtimeScene.getGame().setDefaultHeight(height)
    }
};
gdjs.evtTools.window.setWindowTitle = function(runtimeScene, title) {
    runtimeScene.getGame().getRenderer().setWindowTitle(title)
};
gdjs.evtTools.window.getWindowTitle = function(runtimeScene) {
    runtimeScene.getGame().getRenderer().getWindowTitle()
};
gdjs.evtTools.window.getWindowWidth = function() {
    if (gdjs.RuntimeGameRenderer && gdjs.RuntimeGameRenderer.getScreenWidth) return gdjs.RuntimeGameRenderer.getScreenWidth();
    return typeof window !== "undefined" ? window.innerWidth : 800
};
gdjs.evtTools.window.getWindowHeight = function() {
    if (gdjs.RuntimeGameRenderer && gdjs.RuntimeGameRenderer.getScreenHeight) return gdjs.RuntimeGameRenderer.getScreenHeight();
    return typeof window !== "undefined" ? window.innerHeight : 800
};
gdjs.evtTools.window.getCanvasWidth = function(runtimeScene) {
    return runtimeScene.getGame().getRenderer().getCurrentWidth()
};
gdjs.evtTools.window.getCanvasHeight = function(runtimeScene) {
    return runtimeScene.getGame().getRenderer().getCurrentHeight()
};
gdjs.evtTools.window.openURL = function(url) {
    if (typeof cc !== "undefined" && cc.sys && cc.sys.openURL) {
        cc.sys.openURL(url)
    } else if (typeof Cocoon !== "undefined" && Cocoon.App && Cocoon.App.openURL) {
        Cocoon.App.openURL(url)
    } else if (typeof window !== "undefined") {
        var target = window.cordova ? "_system" : "_blank";
        window.open(url, target)
    }
};
gdjs.evtTools.network = gdjs.evtTools.network || {};
gdjs.evtTools.network.sendHttpRequest = function(host, uri, body, method, contentType, responseVar) {
    try {
        var xhr;
        if (typeof XMLHttpRequest !== "undefined") xhr = new XMLHttpRequest;
        else {
            var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];
            for (var i = 0, len = versions.length; i < len; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break
                } catch (e) {}
            }
        }
        if (xhr === undefined) return;
        xhr.open(method, host + uri, false);
        xhr.setRequestHeader("Content-Type", contentType === "" ? "application/x-www-form-urlencoded" : contentType);
        xhr.send(body);
        responseVar.setString(xhr.responseText)
    } catch (e) {}
};
gdjs.evtTools.network.variableStructureToJSON = function(variable) {
    if (!variable.isStructure()) {
        if (variable.isNumber()) return variable.getAsNumber().toString();
        else return '"' + variable.getAsString() + '"'
    }
    var str = "{";
    var firstChild = true;
    var children = variable.getAllChildren();
    for (var p in children) {
        if (children.hasOwnProperty(p)) {
            if (!firstChild) str += ",";
            str += '"' + p + '": ' + gdjs.evtTools.network.variableStructureToJSON(children[p]);
            firstChild = false
        }
    }
    str += "}";
    return str
};
gdjs.evtTools.network._objectToVariable = function(obj, variable) {
    if (!isNaN(obj)) {
        variable.setNumber(obj)
    } else if (typeof obj == "string" || obj instanceof String) {
        variable.setString(obj)
    } else if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; ++i) {
            gdjs.evtTools.network._objectToVariable(obj[i], variable.getChild(i.toString()))
        }
    } else {
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                gdjs.evtTools.network._objectToVariable(obj[p], variable.getChild(p))
            }
        }
    }
};
gdjs.evtTools.network.jsonToVariableStructure = function(jsonStr, variable) {
    if (jsonStr.length === 0) return;
    try {
        var obj = JSON.parse(jsonStr);
        gdjs.evtTools.network._objectToVariable(obj, variable)
    } catch (e) {}
};
gdjs.TextRuntimeObjectPixiRenderer = function(runtimeObject, runtimeScene) {
    this._object = runtimeObject;
    if (this._text === undefined) this._text = new PIXI.Text(" ", {
        align: "left"
    });
    this._text.anchor.x = .5;
    this._text.anchor.y = .5;
    runtimeScene.getLayer("").getRenderer().addRendererObject(this._text, runtimeObject.getZOrder());
    this._text.text = runtimeObject._str.length === 0 ? " " : runtimeObject._str;
    this._justCreated = true;
    this.updateStyle();
    this.updatePosition()
};
gdjs.TextRuntimeObjectRenderer = gdjs.TextRuntimeObjectPixiRenderer;
gdjs.TextRuntimeObjectPixiRenderer.prototype.getRendererObject = function() {
    return this._text
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.ensureUpToDate = function() {
    if (this._justCreated) {
        this._text.updateText();
        this.updatePosition();
        this._justCreated = false
    }
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.updateStyle = function() {
    var fontName = '"gdjs_font_' + this._object._fontName + '"';
    var style = {
        align: "left"
    };
    style.font = "";
    if (this._object._italic) style.font += "italic ";
    if (this._object._bold) style.font += "bold ";
    style.font += this._object._characterSize + "px " + fontName;
    style.fill = "rgb(" + this._object._color[0] + "," + this._object._color[1] + "," + this._object._color[2] + ")";
    this._text.style = style
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.updatePosition = function() {
    this._text.position.x = this._object.x + this._text.width / 2;
    this._text.position.y = this._object.y + this._text.height / 2
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.updateAngle = function() {
    this._text.rotation = gdjs.toRad(this._object.angle)
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.updateOpacity = function() {
    this._text.alpha = this._object.opacity / 255
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.updateString = function() {
    this._text.text = this._object._str.length === 0 ? " " : this._object._str;
    this._text.updateText()
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.getWidth = function() {
    return this._text.width
};
gdjs.TextRuntimeObjectPixiRenderer.prototype.getHeight = function() {
    return this._text.height
};
gdjs.TextRuntimeObject = function(runtimeScene, objectData) {
    gdjs.RuntimeObject.call(this, runtimeScene, objectData);
    this._characterSize = objectData.characterSize;
    this._fontName = objectData.font || "Arial";
    this._bold = objectData.bold;
    this._italic = objectData.italic;
    this._underlined = objectData.underlined;
    this._color = [objectData.color.r, objectData.color.g, objectData.color.b];
    this._str = objectData.string;
    if (this._renderer) gdjs.TextRuntimeObjectRenderer.call(this._renderer, this, runtimeScene);
    else this._renderer = new gdjs.TextRuntimeObjectRenderer(this, runtimeScene)
};
gdjs.TextRuntimeObject.prototype = Object.create(gdjs.RuntimeObject.prototype);
gdjs.TextRuntimeObject.thisIsARuntimeObjectConstructor = "TextObject::Text";
gdjs.TextRuntimeObject.prototype.getRendererObject = function() {
    return this._renderer.getRendererObject()
};
gdjs.TextRuntimeObject.prototype.updateTime = function() {
    this._renderer.ensureUpToDate()
};
gdjs.TextRuntimeObject.prototype._updateTextPosition = function() {
    this.hitBoxesDirty = true;
    this._renderer.updatePosition()
};
gdjs.TextRuntimeObject.prototype.setX = function(x) {
    gdjs.RuntimeObject.prototype.setX.call(this, x);
    this._updateTextPosition()
};
gdjs.TextRuntimeObject.prototype.setY = function(y) {
    gdjs.RuntimeObject.prototype.setY.call(this, y);
    this._updateTextPosition()
};
gdjs.TextRuntimeObject.prototype.setAngle = function(angle) {
    gdjs.RuntimeObject.prototype.setAngle.call(this, angle);
    this._renderer.updateAngle()
};
gdjs.TextRuntimeObject.prototype.setOpacity = function(opacity) {
    if (opacity < 0) opacity = 0;
    if (opacity > 255) opacity = 255;
    this.opacity = opacity;
    this._renderer.updateOpacity()
};
gdjs.TextRuntimeObject.prototype.getOpacity = function() {
    return this.opacity
};
gdjs.TextRuntimeObject.prototype.getString = function() {
    return this._str
};
gdjs.TextRuntimeObject.prototype.setString = function(str) {
    if (str === this._str) return;
    this._str = str;
    this._renderer.updateString();
    this._updateTextPosition()
};
gdjs.TextRuntimeObject.prototype.getCharacterSize = function() {
    return this._characterSize
};
gdjs.TextRuntimeObject.prototype.setCharacterSize = function(newSize) {
    if (newSize <= 1) newSize = 1;
    this._characterSize = newSize;
    this._renderer.updateStyle()
};
gdjs.TextRuntimeObject.prototype.isBold = function() {
    return this._bold
};
gdjs.TextRuntimeObject.prototype.setBold = function(enable) {
    this._bold = enable;
    this._renderer.updateStyle()
};
gdjs.TextRuntimeObject.prototype.isItalic = function() {
    return this._italic
};
gdjs.TextRuntimeObject.prototype.setItalic = function(enable) {
    this._italic = enable;
    this._renderer.updateStyle()
};
gdjs.TextRuntimeObject.prototype.getWidth = function() {
    return this._renderer.getWidth()
};
gdjs.TextRuntimeObject.prototype.getHeight = function() {
    return this._renderer.getHeight()
};
gdjs.TextRuntimeObject.prototype.setColor = function(str) {
    var color = str.split(";");
    if (color.length < 3) return;
    this._color[0] = parseInt(color[0], 10);
    this._color[1] = parseInt(color[1], 10);
    this._color[2] = parseInt(color[2], 10);
    this._renderer.updateStyle()
};
gdjs.dosCode = {};
gdjs.dosCode.GDlogoObjects1 = [];
gdjs.dosCode.GDlogoObjects2 = [];
gdjs.dosCode.GDtextObjects1 = [];
gdjs.dosCode.GDtextObjects2 = [];
gdjs.dosCode.GDimagenObjects1 = [];
gdjs.dosCode.GDimagenObjects2 = [];
gdjs.dosCode.GDboysObjects1 = [];
gdjs.dosCode.GDboysObjects2 = [];
gdjs.dosCode.GDNuevoObjeto2Objects1 = [];
gdjs.dosCode.GDNuevoObjeto2Objects2 = [];
gdjs.dosCode.GDNuevoObjeto3Objects1 = [];
gdjs.dosCode.GDNuevoObjeto3Objects2 = [];
gdjs.dosCode.GDNuevoObjeto4Objects1 = [];
gdjs.dosCode.GDNuevoObjeto4Objects2 = [];
gdjs.dosCode.conditionTrue_0 = {
    val: false
};
gdjs.dosCode.condition0IsTrue_0 = {
    val: false
};
gdjs.dosCode.condition1IsTrue_0 = {
    val: false
};
gdjs.dosCode.func = function(runtimeScene, context) {
    context.startNewFrame();
    gdjs.dosCode.GDlogoObjects1.length = 0;
    gdjs.dosCode.GDlogoObjects2.length = 0;
    gdjs.dosCode.GDtextObjects1.length = 0;
    gdjs.dosCode.GDtextObjects2.length = 0;
    gdjs.dosCode.GDimagenObjects1.length = 0;
    gdjs.dosCode.GDimagenObjects2.length = 0;
    gdjs.dosCode.GDboysObjects1.length = 0;
    gdjs.dosCode.GDboysObjects2.length = 0;
    gdjs.dosCode.GDNuevoObjeto2Objects1.length = 0;
    gdjs.dosCode.GDNuevoObjeto2Objects2.length = 0;
    gdjs.dosCode.GDNuevoObjeto3Objects1.length = 0;
    gdjs.dosCode.GDNuevoObjeto3Objects2.length = 0;
    gdjs.dosCode.GDNuevoObjeto4Objects1.length = 0;
    gdjs.dosCode.GDNuevoObjeto4Objects2.length = 0; {} {
        gdjs.dosCode.condition0IsTrue_0.val = false; {
            gdjs.dosCode.condition0IsTrue_0.val = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left")
        }
        if (gdjs.dosCode.condition0IsTrue_0.val) {
            {
                gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "id1", false)
            }
        }
    } {
        gdjs.dosCode.GDboysObjects1.createFrom(runtimeScene.getObjects("boys"));
        gdjs.dosCode.condition0IsTrue_0.val = false; {
            gdjs.dosCode.condition0IsTrue_0.val = gdjs.evtTools.input.cursorOnObject(context.clearEventsObjectsMap().addObjectsToEventsMap("boys", gdjs.dosCode.GDboysObjects1).getEventsObjectsMap(), runtimeScene, true, false)
        }
        if (gdjs.dosCode.condition0IsTrue_0.val) {
            {
                for (var i = 0, len = gdjs.dosCode.GDboysObjects1.length; i < len; ++i) {
                    gdjs.dosCode.GDboysObjects1[i].setColor("24;165;60")
                }
            } {
                for (var i = 0, len = gdjs.dosCode.GDboysObjects1.length; i < len; ++i) {
                    gdjs.dosCode.GDboysObjects1[i].setVariableNumber(gdjs.dosCode.GDboysObjects1[i].getVariables().getFromIndex(0), 1)
                }
            }
        }
    } {
        gdjs.dosCode.GDNuevoObjeto2Objects1.createFrom(runtimeScene.getObjects("NuevoObjeto2"));
        gdjs.dosCode.GDboysObjects1.createFrom(runtimeScene.getObjects("boys"));
        gdjs.dosCode.condition0IsTrue_0.val = false; {
            gdjs.dosCode.condition0IsTrue_0.val = gdjs.evtTools.input.cursorOnObject(context.clearEventsObjectsMap().addObjectsToEventsMap("NuevoObjeto2", gdjs.dosCode.GDNuevoObjeto2Objects1).getEventsObjectsMap(), runtimeScene, true, false)
        }
        if (gdjs.dosCode.condition0IsTrue_0.val) {
            {
                for (var i = 0, len = gdjs.dosCode.GDNuevoObjeto2Objects1.length; i < len; ++i) {
                    gdjs.dosCode.GDNuevoObjeto2Objects1[i].setColor("255;19;26")
                }
            } {
                for (var i = 0, len = gdjs.dosCode.GDboysObjects1.length; i < len; ++i) {
                    gdjs.dosCode.GDboysObjects1[i].setVariableNumber(gdjs.dosCode.GDboysObjects1[i].getVariables().getFromIndex(0), 0)
                }
            }
        }
    } {
        gdjs.dosCode.GDNuevoObjeto3Objects1.createFrom(runtimeScene.getObjects("NuevoObjeto3"));
        gdjs.dosCode.GDboysObjects1.createFrom(runtimeScene.getObjects("boys"));
        gdjs.dosCode.condition0IsTrue_0.val = false; {
            gdjs.dosCode.condition0IsTrue_0.val = gdjs.evtTools.input.cursorOnObject(context.clearEventsObjectsMap().addObjectsToEventsMap("NuevoObjeto3", gdjs.dosCode.GDNuevoObjeto3Objects1).getEventsObjectsMap(), runtimeScene, true, false)
        }
        if (gdjs.dosCode.condition0IsTrue_0.val) {
            {
                for (var i = 0, len = gdjs.dosCode.GDNuevoObjeto3Objects1.length; i < len; ++i) {
                    gdjs.dosCode.GDNuevoObjeto3Objects1[i].setColor("255;19;26")
                }
            } {
                for (var i = 0, len = gdjs.dosCode.GDboysObjects1.length; i < len; ++i) {
                    gdjs.dosCode.GDboysObjects1[i].setVariableNumber(gdjs.dosCode.GDboysObjects1[i].getVariables().getFromIndex(0), 0)
                }
            }
        }
    } {
        gdjs.dosCode.GDNuevoObjeto4Objects1.createFrom(runtimeScene.getObjects("NuevoObjeto4"));
        gdjs.dosCode.GDboysObjects1.createFrom(runtimeScene.getObjects("boys"));
        gdjs.dosCode.condition0IsTrue_0.val = false; {
            gdjs.dosCode.condition0IsTrue_0.val = gdjs.evtTools.input.cursorOnObject(context.clearEventsObjectsMap().addObjectsToEventsMap("NuevoObjeto4", gdjs.dosCode.GDNuevoObjeto4Objects1).getEventsObjectsMap(), runtimeScene, true, false)
        }
        if (gdjs.dosCode.condition0IsTrue_0.val) {
            {
                for (var i = 0, len = gdjs.dosCode.GDNuevoObjeto4Objects1.length; i < len; ++i) {
                    gdjs.dosCode.GDNuevoObjeto4Objects1[i].setColor("255;19;26")
                }
            } {
                for (var i = 0, len = gdjs.dosCode.GDboysObjects1.length; i < len; ++i) {
                    gdjs.dosCode.GDboysObjects1[i].setVariableNumber(gdjs.dosCode.GDboysObjects1[i].getVariables().getFromIndex(0), 0)
                }
            }
        }
    } {
        gdjs.dosCode.GDboysObjects1.createFrom(runtimeScene.getObjects("boys"));
        gdjs.dosCode.condition0IsTrue_0.val = false; {
            for (var i = 0, k = 0, l = gdjs.dosCode.GDboysObjects1.length; i < l; ++i) {
                if (gdjs.dosCode.GDboysObjects1[i].getVariableNumber(gdjs.dosCode.GDboysObjects1[i].getVariables().getFromIndex(0)) == 1) {
                    gdjs.dosCode.condition0IsTrue_0.val = true;
                    gdjs.dosCode.GDboysObjects1[k] = gdjs.dosCode.GDboysObjects1[i];
                    ++k
                }
            }
            gdjs.dosCode.GDboysObjects1.length = k
        }
        if (gdjs.dosCode.condition0IsTrue_0.val) {
            {
                {
                    gdjs.dosCode.GDtextObjects2.createFrom(runtimeScene.getObjects("text"));
                    gdjs.dosCode.condition0IsTrue_0.val = false; {
                        gdjs.dosCode.condition0IsTrue_0.val = gdjs.evtTools.runtimeScene.timerElapsedTime(runtimeScene, 2, "mi")
                    }
                    if (gdjs.dosCode.condition0IsTrue_0.val) {
                        {
                            gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "gana", false)
                        } {
                            for (var i = 0, len = gdjs.dosCode.GDtextObjects2.length; i < len; ++i) {
                                gdjs.dosCode.GDtextObjects2[i].setString("mitext")
                            }
                        }
                    }
                }
            }
        }
    }
    return
};
gdjs["dosCode"] = gdjs.dosCode;
gdjs.ganaCode = {};
gdjs.ganaCode.GDdoslogoObjects1 = [];
gdjs.ganaCode.GDNuevoObjetoObjects1 = [];
gdjs.ganaCode.conditionTrue_0 = {
    val: false
};
gdjs.ganaCode.condition0IsTrue_0 = {
    val: false
};
gdjs.ganaCode.condition1IsTrue_0 = {
    val: false
};
gdjs.ganaCode.func = function(runtimeScene, context) {
    context.startNewFrame();
    gdjs.ganaCode.GDdoslogoObjects1.length = 0;
    gdjs.ganaCode.GDNuevoObjetoObjects1.length = 0; {
        gdjs.ganaCode.GDdoslogoObjects1.createFrom(runtimeScene.getObjects("doslogo"));
        gdjs.ganaCode.condition0IsTrue_0.val = false; {
            gdjs.ganaCode.condition0IsTrue_0.val = gdjs.evtTools.input.cursorOnObject(context.clearEventsObjectsMap().addObjectsToEventsMap("doslogo", gdjs.ganaCode.GDdoslogoObjects1).getEventsObjectsMap(), runtimeScene, true, false)
        }
        if (gdjs.ganaCode.condition0IsTrue_0.val) {
            {
                gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "dos", false)
            }
        }
    }
    return
};
gdjs["ganaCode"] = gdjs.ganaCode;
! function(t) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = t();
    else if ("function" == typeof define && define.amd) define([], t);
    else {
        var e;
        e = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, e.PIXI = t()
    }
}(function() {
    var t;
    return function e(t, r, i) {
        function n(s, a) {
            if (!r[s]) {
                if (!t[s]) {
                    var h = "function" == typeof require && require;
                    if (!a && h) return h(s, !0);
                    if (o) return o(s, !0);
                    var u = new Error("Cannot find module '" + s + "'");
                    throw u.code = "MODULE_NOT_FOUND", u
                }
                var l = r[s] = {
                    exports: {}
                };
                t[s][0].call(l.exports, function(e) {
                    var r = t[s][1][e];
                    return n(r ? r : e)
                }, l, l.exports, e, t, r, i)
            }
            return r[s].exports
        }
        for (var o = "function" == typeof require && require, s = 0; s < i.length; s++) n(i[s]);
        return n
    }({
        1: [function(e, r, i) {
            (function(e, i) {
                ! function() {
                    function n() {}

                    function o(t) {
                        return t
                    }

                    function s(t) {
                        return !!t
                    }

                    function a(t) {
                        return !t
                    }

                    function h(t) {
                        return function() {
                            if (null === t) throw new Error("Callback was already called.");
                            t.apply(this, arguments), t = null
                        }
                    }

                    function u(t) {
                        return function() {
                            null !== t && (t.apply(this, arguments), t = null)
                        }
                    }

                    function l(t) {
                        return j(t) || "number" == typeof t.length && t.length >= 0 && t.length % 1 === 0
                    }

                    function c(t, e) {
                        for (var r = -1, i = t.length; ++r < i;) e(t[r], r, t)
                    }

                    function p(t, e) {
                        for (var r = -1, i = t.length, n = Array(i); ++r < i;) n[r] = e(t[r], r, t);
                        return n
                    }

                    function d(t) {
                        return p(Array(t), function(t, e) {
                            return e
                        })
                    }

                    function f(t, e, r) {
                        return c(t, function(t, i, n) {
                            r = e(r, t, i, n)
                        }), r
                    }

                    function v(t, e) {
                        c(Y(t), function(r) {
                            e(t[r], r)
                        })
                    }

                    function g(t, e) {
                        for (var r = 0; r < t.length; r++)
                            if (t[r] === e) return r;
                        return -1
                    }

                    function m(t) {
                        var e, r, i = -1;
                        return l(t) ? (e = t.length, function() {
                            return i++, e > i ? i : null
                        }) : (r = Y(t), e = r.length, function() {
                            return i++, e > i ? r[i] : null
                        })
                    }

                    function y(t, e) {
                        return e = null == e ? t.length - 1 : +e,
                            function() {
                                for (var r = Math.max(arguments.length - e, 0), i = Array(r), n = 0; r > n; n++) i[n] = arguments[n + e];
                                switch (e) {
                                    case 0:
                                        return t.call(this, i);
                                    case 1:
                                        return t.call(this, arguments[0], i)
                                }
                            }
                    }

                    function x(t) {
                        return function(e, r, i) {
                            return t(e, i)
                        }
                    }

                    function b(t) {
                        return function(e, r, i) {
                            i = u(i || n), e = e || [];
                            var o = m(e);
                            if (0 >= t) return i(null);
                            var s = !1,
                                a = 0,
                                l = !1;
                            ! function c() {
                                if (s && 0 >= a) return i(null);
                                for (; t > a && !l;) {
                                    var n = o();
                                    if (null === n) return s = !0, void(0 >= a && i(null));
                                    a += 1, r(e[n], n, h(function(t) {
                                        a -= 1, t ? (i(t), l = !0) : c()
                                    }))
                                }
                            }()
                        }
                    }

                    function _(t) {
                        return function(e, r, i) {
                            return t(N.eachOf, e, r, i)
                        }
                    }

                    function T(t) {
                        return function(e, r, i, n) {
                            return t(b(r), e, i, n)
                        }
                    }

                    function E(t) {
                        return function(e, r, i) {
                            return t(N.eachOfSeries, e, r, i)
                        }
                    }

                    function S(t, e, r, i) {
                        i = u(i || n), e = e || [];
                        var o = l(e) ? [] : {};
                        t(e, function(t, e, i) {
                            r(t, function(t, r) {
                                o[e] = r, i(t)
                            })
                        }, function(t) {
                            i(t, o)
                        })
                    }

                    function w(t, e, r, i) {
                        var n = [];
                        t(e, function(t, e, i) {
                            r(t, function(r) {
                                r && n.push({
                                    index: e,
                                    value: t
                                }), i()
                            })
                        }, function() {
                            i(p(n.sort(function(t, e) {
                                return t.index - e.index
                            }), function(t) {
                                return t.value
                            }))
                        })
                    }

                    function A(t, e, r, i) {
                        w(t, e, function(t, e) {
                            r(t, function(t) {
                                e(!t)
                            })
                        }, i)
                    }

                    function C(t, e, r) {
                        return function(i, n, o, s) {
                            function a() {
                                s && s(r(!1, void 0))
                            }

                            function h(t, i, n) {
                                return s ? void o(t, function(i) {
                                    s && e(i) && (s(r(!0, t)), s = o = !1), n()
                                }) : n()
                            }
                            arguments.length > 3 ? t(i, n, h, a) : (s = o, o = n, t(i, h, a))
                        }
                    }

                    function R(t, e) {
                        return e
                    }

                    function M(t, e, r) {
                        r = r || n;
                        var i = l(e) ? [] : {};
                        t(e, function(t, e, r) {
                            t(y(function(t, n) {
                                n.length <= 1 && (n = n[0]), i[e] = n, r(t)
                            }))
                        }, function(t) {
                            r(t, i)
                        })
                    }

                    function O(t, e, r, i) {
                        var n = [];
                        t(e, function(t, e, i) {
                            r(t, function(t, e) {
                                n = n.concat(e || []), i(t)
                            })
                        }, function(t) {
                            i(t, n)
                        })
                    }

                    function P(t, e, r) {
                        function i(t, e, r, i) {
                            if (null != i && "function" != typeof i) throw new Error("task callback must be a function");
                            return t.started = !0, j(e) || (e = [e]), 0 === e.length && t.idle() ? N.setImmediate(function() {
                                t.drain()
                            }) : (c(e, function(e) {
                                var o = {
                                    data: e,
                                    callback: i || n
                                };
                                r ? t.tasks.unshift(o) : t.tasks.push(o), t.tasks.length === t.concurrency && t.saturated()
                            }), void N.setImmediate(t.process))
                        }

                        function o(t, e) {
                            return function() {
                                s -= 1;
                                var r = !1,
                                    i = arguments;
                                c(e, function(t) {
                                    c(a, function(e, i) {
                                        e !== t || r || (a.splice(i, 1), r = !0)
                                    }), t.callback.apply(t, i)
                                }), t.tasks.length + s === 0 && t.drain(), t.process()
                            }
                        }
                        if (null == e) e = 1;
                        else if (0 === e) throw new Error("Concurrency must not be zero");
                        var s = 0,
                            a = [],
                            u = {
                                tasks: [],
                                concurrency: e,
                                payload: r,
                                saturated: n,
                                empty: n,
                                drain: n,
                                started: !1,
                                paused: !1,
                                push: function(t, e) {
                                    i(u, t, !1, e)
                                },
                                kill: function() {
                                    u.drain = n, u.tasks = []
                                },
                                unshift: function(t, e) {
                                    i(u, t, !0, e)
                                },
                                process: function() {
                                    if (!u.paused && s < u.concurrency && u.tasks.length)
                                        for (; s < u.concurrency && u.tasks.length;) {
                                            var e = u.payload ? u.tasks.splice(0, u.payload) : u.tasks.splice(0, u.tasks.length),
                                                r = p(e, function(t) {
                                                    return t.data
                                                });
                                            0 === u.tasks.length && u.empty(), s += 1, a.push(e[0]);
                                            var i = h(o(u, e));
                                            t(r, i)
                                        }
                                },
                                length: function() {
                                    return u.tasks.length
                                },
                                running: function() {
                                    return s
                                },
                                workersList: function() {
                                    return a
                                },
                                idle: function() {
                                    return u.tasks.length + s === 0
                                },
                                pause: function() {
                                    u.paused = !0
                                },
                                resume: function() {
                                    if (u.paused !== !1) {
                                        u.paused = !1;
                                        for (var t = Math.min(u.concurrency, u.tasks.length), e = 1; t >= e; e++) N.setImmediate(u.process)
                                    }
                                }
                            };
                        return u
                    }

                    function F(t) {
                        return y(function(e, r) {
                            e.apply(null, r.concat([y(function(e, r) {
                                "object" == typeof console && (e ? console.error && console.error(e) : console[t] && c(r, function(e) {
                                    console[t](e)
                                }))
                            })]))
                        })
                    }

                    function D(t) {
                        return function(e, r, i) {
                            t(d(e), r, i)
                        }
                    }

                    function B(t) {
                        return y(function(e, r) {
                            var i = y(function(r) {
                                var i = this,
                                    n = r.pop();
                                return t(e, function(t, e, n) {
                                    t.apply(i, r.concat([n]))
                                }, n)
                            });
                            return r.length ? i.apply(this, r) : i
                        })
                    }

                    function L(t) {
                        return y(function(e) {
                            var r = e.pop();
                            e.push(function() {
                                var t = arguments;
                                i ? N.setImmediate(function() {
                                    r.apply(null, t)
                                }) : r.apply(null, t)
                            });
                            var i = !0;
                            t.apply(this, e), i = !1
                        })
                    }
                    var I, N = {},
                        U = "object" == typeof self && self.self === self && self || "object" == typeof i && i.global === i && i || this;
                    null != U && (I = U.async), N.noConflict = function() {
                        return U.async = I, N
                    };
                    var k = Object.prototype.toString,
                        j = Array.isArray || function(t) {
                            return "[object Array]" === k.call(t)
                        },
                        X = function(t) {
                            var e = typeof t;
                            return "function" === e || "object" === e && !!t
                        },
                        Y = Object.keys || function(t) {
                            var e = [];
                            for (var r in t) t.hasOwnProperty(r) && e.push(r);
                            return e
                        },
                        G = "function" == typeof setImmediate && setImmediate,
                        z = G ? function(t) {
                            G(t)
                        } : function(t) {
                            setTimeout(t, 0)
                        };
                    "object" == typeof e && "function" == typeof e.nextTick ? N.nextTick = e.nextTick : N.nextTick = z, N.setImmediate = G ? z : N.nextTick, N.forEach = N.each = function(t, e, r) {
                        return N.eachOf(t, x(e), r)
                    }, N.forEachSeries = N.eachSeries = function(t, e, r) {
                        return N.eachOfSeries(t, x(e), r)
                    }, N.forEachLimit = N.eachLimit = function(t, e, r, i) {
                        return b(e)(t, x(r), i)
                    }, N.forEachOf = N.eachOf = function(t, e, r) {
                        function i(t) {
                            a--, t ? r(t) : null === o && 0 >= a && r(null)
                        }
                        r = u(r || n), t = t || [];
                        for (var o, s = m(t), a = 0; null != (o = s());) a += 1, e(t[o], o, h(i));
                        0 === a && r(null)
                    }, N.forEachOfSeries = N.eachOfSeries = function(t, e, r) {
                        function i() {
                            var n = !0;
                            return null === s ? r(null) : (e(t[s], s, h(function(t) {
                                if (t) r(t);
                                else {
                                    if (s = o(), null === s) return r(null);
                                    n ? N.setImmediate(i) : i()
                                }
                            })), void(n = !1))
                        }
                        r = u(r || n), t = t || [];
                        var o = m(t),
                            s = o();
                        i()
                    }, N.forEachOfLimit = N.eachOfLimit = function(t, e, r, i) {
                        b(e)(t, r, i)
                    }, N.map = _(S), N.mapSeries = E(S), N.mapLimit = T(S), N.inject = N.foldl = N.reduce = function(t, e, r, i) {
                        N.eachOfSeries(t, function(t, i, n) {
                            r(e, t, function(t, r) {
                                e = r, n(t)
                            })
                        }, function(t) {
                            i(t, e)
                        })
                    }, N.foldr = N.reduceRight = function(t, e, r, i) {
                        var n = p(t, o).reverse();
                        N.reduce(n, e, r, i)
                    }, N.transform = function(t, e, r, i) {
                        3 === arguments.length && (i = r, r = e, e = j(t) ? [] : {}), N.eachOf(t, function(t, i, n) {
                            r(e, t, i, n)
                        }, function(t) {
                            i(t, e)
                        })
                    }, N.select = N.filter = _(w), N.selectLimit = N.filterLimit = T(w), N.selectSeries = N.filterSeries = E(w), N.reject = _(A), N.rejectLimit = T(A), N.rejectSeries = E(A), N.any = N.some = C(N.eachOf, s, o), N.someLimit = C(N.eachOfLimit, s, o), N.all = N.every = C(N.eachOf, a, a), N.everyLimit = C(N.eachOfLimit, a, a), N.detect = C(N.eachOf, o, R), N.detectSeries = C(N.eachOfSeries, o, R), N.detectLimit = C(N.eachOfLimit, o, R), N.sortBy = function(t, e, r) {
                        function i(t, e) {
                            var r = t.criteria,
                                i = e.criteria;
                            return i > r ? -1 : r > i ? 1 : 0
                        }
                        N.map(t, function(t, r) {
                            e(t, function(e, i) {
                                e ? r(e) : r(null, {
                                    value: t,
                                    criteria: i
                                })
                            })
                        }, function(t, e) {
                            return t ? r(t) : void r(null, p(e.sort(i), function(t) {
                                return t.value
                            }))
                        })
                    }, N.auto = function(t, e, r) {
                        function i(t) {
                            d.unshift(t)
                        }

                        function o(t) {
                            var e = g(d, t);
                            e >= 0 && d.splice(e, 1)
                        }

                        function s() {
                            h--, c(d.slice(0), function(t) {
                                t()
                            })
                        }
                        r || (r = e, e = null), r = u(r || n);
                        var a = Y(t),
                            h = a.length;
                        if (!h) return r(null);
                        e || (e = h);
                        var l = {},
                            p = 0,
                            d = [];
                        i(function() {
                            h || r(null, l)
                        }), c(a, function(n) {
                            function a() {
                                return e > p && f(m, function(t, e) {
                                    return t && l.hasOwnProperty(e)
                                }, !0) && !l.hasOwnProperty(n)
                            }

                            function h() {
                                a() && (p++, o(h), c[c.length - 1](d, l))
                            }
                            for (var u, c = j(t[n]) ? t[n] : [t[n]], d = y(function(t, e) {
                                    if (p--, e.length <= 1 && (e = e[0]), t) {
                                        var i = {};
                                        v(l, function(t, e) {
                                            i[e] = t
                                        }), i[n] = e, r(t, i)
                                    } else l[n] = e, N.setImmediate(s)
                                }), m = c.slice(0, c.length - 1), x = m.length; x--;) {
                                if (!(u = t[m[x]])) throw new Error("Has inexistant dependency");
                                if (j(u) && g(u, n) >= 0) throw new Error("Has cyclic dependencies")
                            }
                            a() ? (p++, c[c.length - 1](d, l)) : i(h)
                        })
                    }, N.retry = function(t, e, r) {
                        function i(t, e) {
                            if ("number" == typeof e) t.times = parseInt(e, 10) || o;
                            else {
                                if ("object" != typeof e) throw new Error("Unsupported argument type for 'times': " + typeof e);
                                t.times = parseInt(e.times, 10) || o, t.interval = parseInt(e.interval, 10) || s
                            }
                        }

                        function n(t, e) {
                            function r(t, r) {
                                return function(i) {
                                    t(function(t, e) {
                                        i(!t || r, {
                                            err: t,
                                            result: e
                                        })
                                    }, e)
                                }
                            }

                            function i(t) {
                                return function(e) {
                                    setTimeout(function() {
                                        e(null)
                                    }, t)
                                }
                            }
                            for (; h.times;) {
                                var n = !(h.times -= 1);
                                a.push(r(h.task, n)), !n && h.interval > 0 && a.push(i(h.interval))
                            }
                            N.series(a, function(e, r) {
                                r = r[r.length - 1], (t || h.callback)(r.err, r.result)
                            })
                        }
                        var o = 5,
                            s = 0,
                            a = [],
                            h = {
                                times: o,
                                interval: s
                            },
                            u = arguments.length;
                        if (1 > u || u > 3) throw new Error("Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)");
                        return 2 >= u && "function" == typeof t && (r = e, e = t), "function" != typeof t && i(h, t), h.callback = r, h.task = e, h.callback ? n() : n
                    }, N.waterfall = function(t, e) {
                        function r(t) {
                            return y(function(i, n) {
                                if (i) e.apply(null, [i].concat(n));
                                else {
                                    var o = t.next();
                                    o ? n.push(r(o)) : n.push(e), L(t).apply(null, n)
                                }
                            })
                        }
                        if (e = u(e || n), !j(t)) {
                            var i = new Error("First argument to waterfall must be an array of functions");
                            return e(i)
                        }
                        return t.length ? void r(N.iterator(t))() : e()
                    }, N.parallel = function(t, e) {
                        M(N.eachOf, t, e)
                    }, N.parallelLimit = function(t, e, r) {
                        M(b(e), t, r)
                    }, N.series = function(t, e) {
                        M(N.eachOfSeries, t, e)
                    }, N.iterator = function(t) {
                        function e(r) {
                            function i() {
                                return t.length && t[r].apply(null, arguments), i.next()
                            }
                            return i.next = function() {
                                return r < t.length - 1 ? e(r + 1) : null
                            }, i
                        }
                        return e(0)
                    }, N.apply = y(function(t, e) {
                        return y(function(r) {
                            return t.apply(null, e.concat(r))
                        })
                    }), N.concat = _(O), N.concatSeries = E(O), N.whilst = function(t, e, r) {
                        if (r = r || n, t()) {
                            var i = y(function(n, o) {
                                n ? r(n) : t.apply(this, o) ? e(i) : r(null)
                            });
                            e(i)
                        } else r(null)
                    }, N.doWhilst = function(t, e, r) {
                        var i = 0;
                        return N.whilst(function() {
                            return ++i <= 1 || e.apply(this, arguments)
                        }, t, r)
                    }, N.until = function(t, e, r) {
                        return N.whilst(function() {
                            return !t.apply(this, arguments)
                        }, e, r)
                    }, N.doUntil = function(t, e, r) {
                        return N.doWhilst(t, function() {
                            return !e.apply(this, arguments)
                        }, r)
                    }, N.during = function(t, e, r) {
                        r = r || n;
                        var i = y(function(e, i) {
                                e ? r(e) : (i.push(o), t.apply(this, i))
                            }),
                            o = function(t, n) {
                                t ? r(t) : n ? e(i) : r(null)
                            };
                        t(o)
                    }, N.doDuring = function(t, e, r) {
                        var i = 0;
                        N.during(function(t) {
                            i++ < 1 ? t(null, !0) : e.apply(this, arguments)
                        }, t, r)
                    }, N.queue = function(t, e) {
                        var r = P(function(e, r) {
                            t(e[0], r)
                        }, e, 1);
                        return r
                    }, N.priorityQueue = function(t, e) {
                        function r(t, e) {
                            return t.priority - e.priority
                        }

                        function i(t, e, r) {
                            for (var i = -1, n = t.length - 1; n > i;) {
                                var o = i + (n - i + 1 >>> 1);
                                r(e, t[o]) >= 0 ? i = o : n = o - 1
                            }
                            return i
                        }

                        function o(t, e, o, s) {
                            if (null != s && "function" != typeof s) throw new Error("task callback must be a function");
                            return t.started = !0, j(e) || (e = [e]), 0 === e.length ? N.setImmediate(function() {
                                t.drain()
                            }) : void c(e, function(e) {
                                var a = {
                                    data: e,
                                    priority: o,
                                    callback: "function" == typeof s ? s : n
                                };
                                t.tasks.splice(i(t.tasks, a, r) + 1, 0, a), t.tasks.length === t.concurrency && t.saturated(), N.setImmediate(t.process)
                            })
                        }
                        var s = N.queue(t, e);
                        return s.push = function(t, e, r) {
                            o(s, t, e, r)
                        }, delete s.unshift, s
                    }, N.cargo = function(t, e) {
                        return P(t, 1, e)
                    }, N.log = F("log"), N.dir = F("dir"), N.memoize = function(t, e) {
                        var r = {},
                            i = {};
                        e = e || o;
                        var n = y(function(n) {
                            var o = n.pop(),
                                s = e.apply(null, n);
                            s in r ? N.setImmediate(function() {
                                o.apply(null, r[s])
                            }) : s in i ? i[s].push(o) : (i[s] = [o], t.apply(null, n.concat([y(function(t) {
                                r[s] = t;
                                var e = i[s];
                                delete i[s];
                                for (var n = 0, o = e.length; o > n; n++) e[n].apply(null, t)
                            })])))
                        });
                        return n.memo = r, n.unmemoized = t, n
                    }, N.unmemoize = function(t) {
                        return function() {
                            return (t.unmemoized || t).apply(null, arguments)
                        }
                    }, N.times = D(N.map), N.timesSeries = D(N.mapSeries), N.timesLimit = function(t, e, r, i) {
                        return N.mapLimit(d(t), e, r, i)
                    }, N.seq = function() {
                        var t = arguments;
                        return y(function(e) {
                            var r = this,
                                i = e[e.length - 1];
                            "function" == typeof i ? e.pop() : i = n, N.reduce(t, e, function(t, e, i) {
                                e.apply(r, t.concat([y(function(t, e) {
                                    i(t, e)
                                })]))
                            }, function(t, e) {
                                i.apply(r, [t].concat(e))
                            })
                        })
                    }, N.compose = function() {
                        return N.seq.apply(null, Array.prototype.reverse.call(arguments))
                    }, N.applyEach = B(N.eachOf), N.applyEachSeries = B(N.eachOfSeries), N.forever = function(t, e) {
                        function r(t) {
                            return t ? i(t) : void o(r)
                        }
                        var i = h(e || n),
                            o = L(t);
                        r()
                    }, N.ensureAsync = L, N.constant = y(function(t) {
                        var e = [null].concat(t);
                        return function(t) {
                            return t.apply(this, e)
                        }
                    }), N.wrapSync = N.asyncify = function(t) {
                        return y(function(e) {
                            var r, i = e.pop();
                            try {
                                r = t.apply(this, e)
                            } catch (n) {
                                return i(n)
                            }
                            X(r) && "function" == typeof r.then ? r.then(function(t) {
                                i(null, t)
                            })["catch"](function(t) {
                                i(t.message ? t : new Error(t))
                            }) : i(null, r)
                        })
                    }, "object" == typeof r && r.exports ? r.exports = N : "function" == typeof t && t.amd ? t([], function() {
                        return N
                    }) : U.async = N
                }()
            }).call(this, e("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            _process: 3
        }],
        2: [function(t, e, r) {
            (function(t) {
                function e(t, e) {
                    for (var r = 0, i = t.length - 1; i >= 0; i--) {
                        var n = t[i];
                        "." === n ? t.splice(i, 1) : ".." === n ? (t.splice(i, 1), r++) : r && (t.splice(i, 1), r--)
                    }
                    if (e)
                        for (; r--; r) t.unshift("..");
                    return t
                }

                function i(t, e) {
                    if (t.filter) return t.filter(e);
                    for (var r = [], i = 0; i < t.length; i++) e(t[i], i, t) && r.push(t[i]);
                    return r
                }
                var n = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/,
                    o = function(t) {
                        return n.exec(t).slice(1)
                    };
                r.resolve = function() {
                    for (var r = "", n = !1, o = arguments.length - 1; o >= -1 && !n; o--) {
                        var s = o >= 0 ? arguments[o] : t.cwd();
                        if ("string" != typeof s) throw new TypeError("Arguments to path.resolve must be strings");
                        s && (r = s + "/" + r, n = "/" === s.charAt(0))
                    }
                    return r = e(i(r.split("/"), function(t) {
                        return !!t
                    }), !n).join("/"), (n ? "/" : "") + r || "."
                }, r.normalize = function(t) {
                    var n = r.isAbsolute(t),
                        o = "/" === s(t, -1);
                    return t = e(i(t.split("/"), function(t) {
                        return !!t
                    }), !n).join("/"), t || n || (t = "."), t && o && (t += "/"), (n ? "/" : "") + t
                }, r.isAbsolute = function(t) {
                    return "/" === t.charAt(0)
                }, r.join = function() {
                    var t = Array.prototype.slice.call(arguments, 0);
                    return r.normalize(i(t, function(t, e) {
                        if ("string" != typeof t) throw new TypeError("Arguments to path.join must be strings");
                        return t
                    }).join("/"))
                }, r.relative = function(t, e) {
                    function i(t) {
                        for (var e = 0; e < t.length && "" === t[e]; e++);
                        for (var r = t.length - 1; r >= 0 && "" === t[r]; r--);
                        return e > r ? [] : t.slice(e, r - e + 1)
                    }
                    t = r.resolve(t).substr(1), e = r.resolve(e).substr(1);
                    for (var n = i(t.split("/")), o = i(e.split("/")), s = Math.min(n.length, o.length), a = s, h = 0; s > h; h++)
                        if (n[h] !== o[h]) {
                            a = h;
                            break
                        }
                    for (var u = [], h = a; h < n.length; h++) u.push("..");
                    return u = u.concat(o.slice(a)), u.join("/")
                }, r.sep = "/", r.delimiter = ":", r.dirname = function(t) {
                    var e = o(t),
                        r = e[0],
                        i = e[1];
                    return r || i ? (i && (i = i.substr(0, i.length - 1)), r + i) : "."
                }, r.basename = function(t, e) {
                    var r = o(t)[2];
                    return e && r.substr(-1 * e.length) === e && (r = r.substr(0, r.length - e.length)), r
                }, r.extname = function(t) {
                    return o(t)[3]
                };
                var s = "b" === "ab".substr(-1) ? function(t, e, r) {
                    return t.substr(e, r)
                } : function(t, e, r) {
                    return 0 > e && (e = t.length + e), t.substr(e, r)
                }
            }).call(this, t("_process"))
        }, {
            _process: 3
        }],
        3: [function(t, e, r) {
            function i() {
                l = !1, a.length ? u = a.concat(u) : c = -1, u.length && n()
            }

            function n() {
                if (!l) {
                    var t = setTimeout(i);
                    l = !0;
                    for (var e = u.length; e;) {
                        for (a = u, u = []; ++c < e;) a && a[c].run();
                        c = -1, e = u.length
                    }
                    a = null, l = !1, clearTimeout(t)
                }
            }

            function o(t, e) {
                this.fun = t, this.array = e
            }

            function s() {}
            var a, h = e.exports = {},
                u = [],
                l = !1,
                c = -1;
            h.nextTick = function(t) {
                var e = new Array(arguments.length - 1);
                if (arguments.length > 1)
                    for (var r = 1; r < arguments.length; r++) e[r - 1] = arguments[r];
                u.push(new o(t, e)), 1 !== u.length || l || setTimeout(n, 0)
            }, o.prototype.run = function() {
                this.fun.apply(null, this.array)
            }, h.title = "browser", h.browser = !0, h.env = {}, h.argv = [], h.version = "", h.versions = {}, h.on = s, h.addListener = s, h.once = s, h.off = s, h.removeListener = s, h.removeAllListeners = s, h.emit = s, h.binding = function(t) {
                throw new Error("process.binding is not supported")
            }, h.cwd = function() {
                return "/"
            }, h.chdir = function(t) {
                throw new Error("process.chdir is not supported")
            }, h.umask = function() {
                return 0
            }
        }, {}],
        4: [function(e, r, i) {
            (function(e) {
                ! function(n) {
                    function o(t) {
                        throw RangeError(B[t])
                    }

                    function s(t, e) {
                        for (var r = t.length, i = []; r--;) i[r] = e(t[r]);
                        return i
                    }

                    function a(t, e) {
                        var r = t.split("@"),
                            i = "";
                        r.length > 1 && (i = r[0] + "@", t = r[1]), t = t.replace(D, ".");
                        var n = t.split("."),
                            o = s(n, e).join(".");
                        return i + o
                    }

                    function h(t) {
                        for (var e, r, i = [], n = 0, o = t.length; o > n;) e = t.charCodeAt(n++), e >= 55296 && 56319 >= e && o > n ? (r = t.charCodeAt(n++), 56320 == (64512 & r) ? i.push(((1023 & e) << 10) + (1023 & r) + 65536) : (i.push(e), n--)) : i.push(e);
                        return i
                    }

                    function u(t) {
                        return s(t, function(t) {
                            var e = "";
                            return t > 65535 && (t -= 65536, e += N(t >>> 10 & 1023 | 55296), t = 56320 | 1023 & t), e += N(t)
                        }).join("")
                    }

                    function l(t) {
                        return 10 > t - 48 ? t - 22 : 26 > t - 65 ? t - 65 : 26 > t - 97 ? t - 97 : E
                    }

                    function c(t, e) {
                        return t + 22 + 75 * (26 > t) - ((0 != e) << 5)
                    }

                    function p(t, e, r) {
                        var i = 0;
                        for (t = r ? I(t / C) : t >> 1, t += I(t / e); t > L * w >> 1; i += E) t = I(t / L);
                        return I(i + (L + 1) * t / (t + A))
                    }

                    function d(t) {
                        var e, r, i, n, s, a, h, c, d, f, v = [],
                            g = t.length,
                            m = 0,
                            y = M,
                            x = R;
                        for (r = t.lastIndexOf(O), 0 > r && (r = 0), i = 0; r > i; ++i) t.charCodeAt(i) >= 128 && o("not-basic"), v.push(t.charCodeAt(i));
                        for (n = r > 0 ? r + 1 : 0; g > n;) {
                            for (s = m, a = 1, h = E; n >= g && o("invalid-input"), c = l(t.charCodeAt(n++)), (c >= E || c > I((T - m) / a)) && o("overflow"), m += c * a, d = x >= h ? S : h >= x + w ? w : h - x, !(d > c); h += E) f = E - d, a > I(T / f) && o("overflow"), a *= f;
                            e = v.length + 1, x = p(m - s, e, 0 == s), I(m / e) > T - y && o("overflow"), y += I(m / e), m %= e, v.splice(m++, 0, y)
                        }
                        return u(v)
                    }

                    function f(t) {
                        var e, r, i, n, s, a, u, l, d, f, v, g, m, y, x, b = [];
                        for (t = h(t), g = t.length, e = M, r = 0, s = R, a = 0; g > a; ++a) v = t[a], 128 > v && b.push(N(v));
                        for (i = n = b.length, n && b.push(O); g > i;) {
                            for (u = T, a = 0; g > a; ++a) v = t[a], v >= e && u > v && (u = v);
                            for (m = i + 1, u - e > I((T - r) / m) && o("overflow"), r += (u - e) * m, e = u, a = 0; g > a; ++a)
                                if (v = t[a], e > v && ++r > T && o("overflow"), v == e) {
                                    for (l = r, d = E; f = s >= d ? S : d >= s + w ? w : d - s, !(f > l); d += E) x = l - f, y = E - f, b.push(N(c(f + x % y, 0))), l = I(x / y);
                                    b.push(N(c(l, 0))), s = p(r, m, i == n), r = 0, ++i
                                }++r, ++e
                        }
                        return b.join("")
                    }

                    function v(t) {
                        return a(t, function(t) {
                            return P.test(t) ? d(t.slice(4).toLowerCase()) : t
                        })
                    }

                    function g(t) {
                        return a(t, function(t) {
                            return F.test(t) ? "xn--" + f(t) : t
                        })
                    }
                    var m = "object" == typeof i && i && !i.nodeType && i,
                        y = "object" == typeof r && r && !r.nodeType && r,
                        x = "object" == typeof e && e;
                    (x.global === x || x.window === x || x.self === x) && (n = x);
                    var b, _, T = 2147483647,
                        E = 36,
                        S = 1,
                        w = 26,
                        A = 38,
                        C = 700,
                        R = 72,
                        M = 128,
                        O = "-",
                        P = /^xn--/,
                        F = /[^\x20-\x7E]/,
                        D = /[\x2E\u3002\uFF0E\uFF61]/g,
                        B = {
                            overflow: "Overflow: input needs wider integers to process",
                            "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                            "invalid-input": "Invalid input"
                        },
                        L = E - S,
                        I = Math.floor,
                        N = String.fromCharCode;
                    if (b = {
                            version: "1.3.2",
                            ucs2: {
                                decode: h,
                                encode: u
                            },
                            decode: d,
                            encode: f,
                            toASCII: g,
                            toUnicode: v
                        }, "function" == typeof t && "object" == typeof t.amd && t.amd) t("punycode", function() {
                        return b
                    });
                    else if (m && y)
                        if (r.exports == m) y.exports = b;
                        else
                            for (_ in b) b.hasOwnProperty(_) && (m[_] = b[_]);
                    else n.punycode = b
                }(this)
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {}],
        5: [function(t, e, r) {
            "use strict";

            function i(t, e) {
                return Object.prototype.hasOwnProperty.call(t, e)
            }
            e.exports = function(t, e, r, o) {
                e = e || "&", r = r || "=";
                var s = {};
                if ("string" != typeof t || 0 === t.length) return s;
                var a = /\+/g;
                t = t.split(e);
                var h = 1e3;
                o && "number" == typeof o.maxKeys && (h = o.maxKeys);
                var u = t.length;
                h > 0 && u > h && (u = h);
                for (var l = 0; u > l; ++l) {
                    var c, p, d, f, v = t[l].replace(a, "%20"),
                        g = v.indexOf(r);
                    g >= 0 ? (c = v.substr(0, g), p = v.substr(g + 1)) : (c = v, p = ""), d = decodeURIComponent(c), f = decodeURIComponent(p), i(s, d) ? n(s[d]) ? s[d].push(f) : s[d] = [s[d], f] : s[d] = f
                }
                return s
            };
            var n = Array.isArray || function(t) {
                return "[object Array]" === Object.prototype.toString.call(t)
            }
        }, {}],
        6: [function(t, e, r) {
            "use strict";

            function i(t, e) {
                if (t.map) return t.map(e);
                for (var r = [], i = 0; i < t.length; i++) r.push(e(t[i], i));
                return r
            }
            var n = function(t) {
                switch (typeof t) {
                    case "string":
                        return t;
                    case "boolean":
                        return t ? "true" : "false";
                    case "number":
                        return isFinite(t) ? t : "";
                    default:
                        return ""
                }
            };
            e.exports = function(t, e, r, a) {
                return e = e || "&", r = r || "=", null === t && (t = void 0), "object" == typeof t ? i(s(t), function(s) {
                    var a = encodeURIComponent(n(s)) + r;
                    return o(t[s]) ? i(t[s], function(t) {
                        return a + encodeURIComponent(n(t))
                    }).join(e) : a + encodeURIComponent(n(t[s]))
                }).join(e) : a ? encodeURIComponent(n(a)) + r + encodeURIComponent(n(t)) : ""
            };
            var o = Array.isArray || function(t) {
                    return "[object Array]" === Object.prototype.toString.call(t)
                },
                s = Object.keys || function(t) {
                    var e = [];
                    for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && e.push(r);
                    return e
                }
        }, {}],
        7: [function(t, e, r) {
            "use strict";
            r.decode = r.parse = t("./decode"), r.encode = r.stringify = t("./encode")
        }, {
            "./decode": 5,
            "./encode": 6
        }],
        8: [function(t, e, r) {
            function i() {
                this.protocol = null, this.slashes = null, this.auth = null, this.host = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.query = null, this.pathname = null, this.path = null, this.href = null
            }

            function n(t, e, r) {
                if (t && u(t) && t instanceof i) return t;
                var n = new i;
                return n.parse(t, e, r), n
            }

            function o(t) {
                return h(t) && (t = n(t)), t instanceof i ? t.format() : i.prototype.format.call(t)
            }

            function s(t, e) {
                return n(t, !1, !0).resolve(e)
            }

            function a(t, e) {
                return t ? n(t, !1, !0).resolveObject(e) : e
            }

            function h(t) {
                return "string" == typeof t
            }

            function u(t) {
                return "object" == typeof t && null !== t
            }

            function l(t) {
                return null === t
            }

            function c(t) {
                return null == t
            }
            var p = t("punycode");
            r.parse = n, r.resolve = s, r.resolveObject = a, r.format = o, r.Url = i;
            var d = /^([a-z0-9.+-]+:)/i,
                f = /:[0-9]*$/,
                v = ["<", ">", '"', "`", " ", "\r", "\n", "	"],
                g = ["{", "}", "|", "\\", "^", "`"].concat(v),
                m = ["'"].concat(g),
                y = ["%", "/", "?", ";", "#"].concat(m),
                x = ["/", "?", "#"],
                b = 255,
                _ = /^[a-z0-9A-Z_-]{0,63}$/,
                T = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
                E = {
                    javascript: !0,
                    "javascript:": !0
                },
                S = {
                    javascript: !0,
                    "javascript:": !0
                },
                w = {
                    http: !0,
                    https: !0,
                    ftp: !0,
                    gopher: !0,
                    file: !0,
                    "http:": !0,
                    "https:": !0,
                    "ftp:": !0,
                    "gopher:": !0,
                    "file:": !0
                },
                A = t("querystring");
            i.prototype.parse = function(t, e, r) {
                if (!h(t)) throw new TypeError("Parameter 'url' must be a string, not " + typeof t);
                var i = t;
                i = i.trim();
                var n = d.exec(i);
                if (n) {
                    n = n[0];
                    var o = n.toLowerCase();
                    this.protocol = o, i = i.substr(n.length)
                }
                if (r || n || i.match(/^\/\/[^@\/]+@[^@\/]+/)) {
                    var s = "//" === i.substr(0, 2);
                    !s || n && S[n] || (i = i.substr(2), this.slashes = !0)
                }
                if (!S[n] && (s || n && !w[n])) {
                    for (var a = -1, u = 0; u < x.length; u++) {
                        var l = i.indexOf(x[u]); - 1 !== l && (-1 === a || a > l) && (a = l)
                    }
                    var c, f;
                    f = -1 === a ? i.lastIndexOf("@") : i.lastIndexOf("@", a), -1 !== f && (c = i.slice(0, f), i = i.slice(f + 1), this.auth = decodeURIComponent(c)), a = -1;
                    for (var u = 0; u < y.length; u++) {
                        var l = i.indexOf(y[u]); - 1 !== l && (-1 === a || a > l) && (a = l)
                    } - 1 === a && (a = i.length), this.host = i.slice(0, a), i = i.slice(a), this.parseHost(), this.hostname = this.hostname || "";
                    var v = "[" === this.hostname[0] && "]" === this.hostname[this.hostname.length - 1];
                    if (!v)
                        for (var g = this.hostname.split(/\./), u = 0, C = g.length; C > u; u++) {
                            var R = g[u];
                            if (R && !R.match(_)) {
                                for (var M = "", O = 0, P = R.length; P > O; O++) M += R.charCodeAt(O) > 127 ? "x" : R[O];
                                if (!M.match(_)) {
                                    var F = g.slice(0, u),
                                        D = g.slice(u + 1),
                                        B = R.match(T);
                                    B && (F.push(B[1]), D.unshift(B[2])), D.length && (i = "/" + D.join(".") + i), this.hostname = F.join(".");
                                    break
                                }
                            }
                        }
                    if (this.hostname.length > b ? this.hostname = "" : this.hostname = this.hostname.toLowerCase(), !v) {
                        for (var L = this.hostname.split("."), I = [], u = 0; u < L.length; ++u) {
                            var N = L[u];
                            I.push(N.match(/[^A-Za-z0-9_-]/) ? "xn--" + p.encode(N) : N)
                        }
                        this.hostname = I.join(".")
                    }
                    var U = this.port ? ":" + this.port : "",
                        k = this.hostname || "";
                    this.host = k + U, this.href += this.host, v && (this.hostname = this.hostname.substr(1, this.hostname.length - 2), "/" !== i[0] && (i = "/" + i))
                }
                if (!E[o])
                    for (var u = 0, C = m.length; C > u; u++) {
                        var j = m[u],
                            X = encodeURIComponent(j);
                        X === j && (X = escape(j)), i = i.split(j).join(X)
                    }
                var Y = i.indexOf("#"); - 1 !== Y && (this.hash = i.substr(Y), i = i.slice(0, Y));
                var G = i.indexOf("?");
                if (-1 !== G ? (this.search = i.substr(G), this.query = i.substr(G + 1), e && (this.query = A.parse(this.query)), i = i.slice(0, G)) : e && (this.search = "", this.query = {}), i && (this.pathname = i), w[o] && this.hostname && !this.pathname && (this.pathname = "/"), this.pathname || this.search) {
                    var U = this.pathname || "",
                        N = this.search || "";
                    this.path = U + N
                }
                return this.href = this.format(), this
            }, i.prototype.format = function() {
                var t = this.auth || "";
                t && (t = encodeURIComponent(t), t = t.replace(/%3A/i, ":"), t += "@");
                var e = this.protocol || "",
                    r = this.pathname || "",
                    i = this.hash || "",
                    n = !1,
                    o = "";
                this.host ? n = t + this.host : this.hostname && (n = t + (-1 === this.hostname.indexOf(":") ? this.hostname : "[" + this.hostname + "]"), this.port && (n += ":" + this.port)), this.query && u(this.query) && Object.keys(this.query).length && (o = A.stringify(this.query));
                var s = this.search || o && "?" + o || "";
                return e && ":" !== e.substr(-1) && (e += ":"), this.slashes || (!e || w[e]) && n !== !1 ? (n = "//" + (n || ""), r && "/" !== r.charAt(0) && (r = "/" + r)) : n || (n = ""), i && "#" !== i.charAt(0) && (i = "#" + i), s && "?" !== s.charAt(0) && (s = "?" + s), r = r.replace(/[?#]/g, function(t) {
                    return encodeURIComponent(t)
                }), s = s.replace("#", "%23"), e + n + r + s + i
            }, i.prototype.resolve = function(t) {
                return this.resolveObject(n(t, !1, !0)).format()
            }, i.prototype.resolveObject = function(t) {
                if (h(t)) {
                    var e = new i;
                    e.parse(t, !1, !0), t = e
                }
                var r = new i;
                if (Object.keys(this).forEach(function(t) {
                        r[t] = this[t]
                    }, this), r.hash = t.hash, "" === t.href) return r.href = r.format(), r;
                if (t.slashes && !t.protocol) return Object.keys(t).forEach(function(e) {
                    "protocol" !== e && (r[e] = t[e])
                }), w[r.protocol] && r.hostname && !r.pathname && (r.path = r.pathname = "/"), r.href = r.format(), r;
                if (t.protocol && t.protocol !== r.protocol) {
                    if (!w[t.protocol]) return Object.keys(t).forEach(function(e) {
                        r[e] = t[e]
                    }), r.href = r.format(), r;
                    if (r.protocol = t.protocol, t.host || S[t.protocol]) r.pathname = t.pathname;
                    else {
                        for (var n = (t.pathname || "").split("/"); n.length && !(t.host = n.shift()););
                        t.host || (t.host = ""), t.hostname || (t.hostname = ""), "" !== n[0] && n.unshift(""), n.length < 2 && n.unshift(""), r.pathname = n.join("/")
                    }
                    if (r.search = t.search, r.query = t.query, r.host = t.host || "", r.auth = t.auth, r.hostname = t.hostname || t.host, r.port = t.port, r.pathname || r.search) {
                        var o = r.pathname || "",
                            s = r.search || "";
                        r.path = o + s
                    }
                    return r.slashes = r.slashes || t.slashes, r.href = r.format(), r
                }
                var a = r.pathname && "/" === r.pathname.charAt(0),
                    u = t.host || t.pathname && "/" === t.pathname.charAt(0),
                    p = u || a || r.host && t.pathname,
                    d = p,
                    f = r.pathname && r.pathname.split("/") || [],
                    n = t.pathname && t.pathname.split("/") || [],
                    v = r.protocol && !w[r.protocol];
                if (v && (r.hostname = "", r.port = null, r.host && ("" === f[0] ? f[0] = r.host : f.unshift(r.host)), r.host = "", t.protocol && (t.hostname = null, t.port = null, t.host && ("" === n[0] ? n[0] = t.host : n.unshift(t.host)), t.host = null), p = p && ("" === n[0] || "" === f[0])), u) r.host = t.host || "" === t.host ? t.host : r.host, r.hostname = t.hostname || "" === t.hostname ? t.hostname : r.hostname, r.search = t.search, r.query = t.query, f = n;
                else if (n.length) f || (f = []), f.pop(), f = f.concat(n), r.search = t.search, r.query = t.query;
                else if (!c(t.search)) {
                    if (v) {
                        r.hostname = r.host = f.shift();
                        var g = r.host && r.host.indexOf("@") > 0 ? r.host.split("@") : !1;
                        g && (r.auth = g.shift(), r.host = r.hostname = g.shift())
                    }
                    return r.search = t.search, r.query = t.query, l(r.pathname) && l(r.search) || (r.path = (r.pathname ? r.pathname : "") + (r.search ? r.search : "")), r.href = r.format(), r
                }
                if (!f.length) return r.pathname = null, r.search ? r.path = "/" + r.search : r.path = null, r.href = r.format(), r;
                for (var m = f.slice(-1)[0], y = (r.host || t.host) && ("." === m || ".." === m) || "" === m, x = 0, b = f.length; b >= 0; b--) m = f[b], "." == m ? f.splice(b, 1) : ".." === m ? (f.splice(b, 1), x++) : x && (f.splice(b, 1), x--);
                if (!p && !d)
                    for (; x--; x) f.unshift("..");
                !p || "" === f[0] || f[0] && "/" === f[0].charAt(0) || f.unshift(""), y && "/" !== f.join("/").substr(-1) && f.push("");
                var _ = "" === f[0] || f[0] && "/" === f[0].charAt(0);
                if (v) {
                    r.hostname = r.host = _ ? "" : f.length ? f.shift() : "";
                    var g = r.host && r.host.indexOf("@") > 0 ? r.host.split("@") : !1;
                    g && (r.auth = g.shift(), r.host = r.hostname = g.shift())
                }
                return p = p || r.host && f.length, p && !_ && f.unshift(""), f.length ? r.pathname = f.join("/") : (r.pathname = null, r.path = null), l(r.pathname) && l(r.search) || (r.path = (r.pathname ? r.pathname : "") + (r.search ? r.search : "")), r.auth = t.auth || r.auth, r.slashes = r.slashes || t.slashes, r.href = r.format(), r
            }, i.prototype.parseHost = function() {
                var t = this.host,
                    e = f.exec(t);
                e && (e = e[0], ":" !== e && (this.port = e.substr(1)), t = t.substr(0, t.length - e.length)), t && (this.hostname = t)
            }
        }, {
            punycode: 4,
            querystring: 7
        }],
        9: [function(t, e, r) {
            "use strict";

            function i(t, e, r) {
                r = r || 2;
                var i = e && e.length,
                    o = i ? e[0] * r : t.length,
                    a = n(t, 0, o, r, !0),
                    h = [];
                if (!a) return h;
                var u, l, p, d, f, v, g;
                if (i && (a = c(t, e, a, r)), t.length > 80 * r) {
                    u = p = t[0], l = d = t[1];
                    for (var m = r; o > m; m += r) f = t[m], v = t[m + 1], u > f && (u = f), l > v && (l = v), f > p && (p = f), v > d && (d = v);
                    g = Math.max(p - u, d - l)
                }
                return s(a, h, r, u, l, g), h
            }

            function n(t, e, r, i, n) {
                var o, s, a, h = 0;
                for (o = e, s = r - i; r > o; o += i) h += (t[s] - t[o]) * (t[o + 1] + t[s + 1]), s = o;
                if (n === h > 0)
                    for (o = e; r > o; o += i) a = R(o, t[o], t[o + 1], a);
                else
                    for (o = r - i; o >= e; o -= i) a = R(o, t[o], t[o + 1], a);
                return a
            }

            function o(t, e) {
                if (!t) return t;
                e || (e = t);
                var r, i = t;
                do
                    if (r = !1, i.steiner || !T(i, i.next) && 0 !== _(i.prev, i, i.next)) i = i.next;
                    else {
                        if (M(i), i = e = i.prev, i === i.next) return null;
                        r = !0
                    }
                while (r || i !== e);
                return e
            }

            function s(t, e, r, i, n, c, p) {
                if (t) {
                    !p && c && v(t, i, n, c);
                    for (var d, f, g = t; t.prev !== t.next;)
                        if (d = t.prev, f = t.next, c ? h(t, i, n, c) : a(t)) e.push(d.i / r), e.push(t.i / r), e.push(f.i / r), M(t), t = f.next, g = f.next;
                        else if (t = f, t === g) {
                        p ? 1 === p ? (t = u(t, e, r), s(t, e, r, i, n, c, 2)) : 2 === p && l(t, e, r, i, n, c) : s(o(t), e, r, i, n, c, 1);
                        break
                    }
                }
            }

            function a(t) {
                var e = t.prev,
                    r = t,
                    i = t.next;
                if (_(e, r, i) >= 0) return !1;
                for (var n = t.next.next; n !== t.prev;) {
                    if (x(e.x, e.y, r.x, r.y, i.x, i.y, n.x, n.y) && _(n.prev, n, n.next) >= 0) return !1;
                    n = n.next
                }
                return !0
            }

            function h(t, e, r, i) {
                var n = t.prev,
                    o = t,
                    s = t.next;
                if (_(n, o, s) >= 0) return !1;
                for (var a = n.x < o.x ? n.x < s.x ? n.x : s.x : o.x < s.x ? o.x : s.x, h = n.y < o.y ? n.y < s.y ? n.y : s.y : o.y < s.y ? o.y : s.y, u = n.x > o.x ? n.x > s.x ? n.x : s.x : o.x > s.x ? o.x : s.x, l = n.y > o.y ? n.y > s.y ? n.y : s.y : o.y > s.y ? o.y : s.y, c = m(a, h, e, r, i), p = m(u, l, e, r, i), d = t.nextZ; d && d.z <= p;) {
                    if (d !== t.prev && d !== t.next && x(n.x, n.y, o.x, o.y, s.x, s.y, d.x, d.y) && _(d.prev, d, d.next) >= 0) return !1;
                    d = d.nextZ
                }
                for (d = t.prevZ; d && d.z >= c;) {
                    if (d !== t.prev && d !== t.next && x(n.x, n.y, o.x, o.y, s.x, s.y, d.x, d.y) && _(d.prev, d, d.next) >= 0) return !1;
                    d = d.prevZ
                }
                return !0
            }

            function u(t, e, r) {
                var i = t;
                do {
                    var n = i.prev,
                        o = i.next.next;
                    E(n, i, i.next, o) && w(n, o) && w(o, n) && (e.push(n.i / r), e.push(i.i / r), e.push(o.i / r), M(i), M(i.next), i = t = o), i = i.next
                } while (i !== t);
                return i
            }

            function l(t, e, r, i, n, a) {
                var h = t;
                do {
                    for (var u = h.next.next; u !== h.prev;) {
                        if (h.i !== u.i && b(h, u)) {
                            var l = C(h, u);
                            return h = o(h, h.next), l = o(l, l.next), s(h, e, r, i, n, a), void s(l, e, r, i, n, a)
                        }
                        u = u.next
                    }
                    h = h.next
                } while (h !== t)
            }

            function c(t, e, r, i) {
                var s, a, h, u, l, c = [];
                for (s = 0, a = e.length; a > s; s++) h = e[s] * i, u = a - 1 > s ? e[s + 1] * i : t.length, l = n(t, h, u, i, !1), l === l.next && (l.steiner = !0), c.push(y(l));
                for (c.sort(p), s = 0; s < c.length; s++) d(c[s], r), r = o(r, r.next);
                return r
            }

            function p(t, e) {
                return t.x - e.x
            }

            function d(t, e) {
                if (e = f(t, e)) {
                    var r = C(e, t);
                    o(r, r.next)
                }
            }

            function f(t, e) {
                var r, i = e,
                    n = t.x,
                    o = t.y,
                    s = -(1 / 0);
                do {
                    if (o <= i.y && o >= i.next.y) {
                        var a = i.x + (o - i.y) * (i.next.x - i.x) / (i.next.y - i.y);
                        n >= a && a > s && (s = a, r = i.x < i.next.x ? i : i.next)
                    }
                    i = i.next
                } while (i !== e);
                if (!r) return null;
                var h, u = r,
                    l = 1 / 0;
                for (i = r.next; i !== u;) n >= i.x && i.x >= r.x && x(o < r.y ? n : s, o, r.x, r.y, o < r.y ? s : n, o, i.x, i.y) && (h = Math.abs(o - i.y) / (n - i.x), (l > h || h === l && i.x > r.x) && w(i, t) && (r = i, l = h)), i = i.next;
                return r
            }

            function v(t, e, r, i) {
                var n = t;
                do null === n.z && (n.z = m(n.x, n.y, e, r, i)), n.prevZ = n.prev, n.nextZ = n.next, n = n.next; while (n !== t);
                n.prevZ.nextZ = null, n.prevZ = null, g(n)
            }

            function g(t) {
                var e, r, i, n, o, s, a, h, u = 1;
                do {
                    for (r = t, t = null, o = null, s = 0; r;) {
                        for (s++, i = r, a = 0, e = 0; u > e && (a++, i = i.nextZ, i); e++);
                        for (h = u; a > 0 || h > 0 && i;) 0 === a ? (n = i, i = i.nextZ, h--) : 0 !== h && i ? r.z <= i.z ? (n = r, r = r.nextZ, a--) : (n = i, i = i.nextZ, h--) : (n = r, r = r.nextZ, a--), o ? o.nextZ = n : t = n, n.prevZ = o, o = n;
                        r = i
                    }
                    o.nextZ = null, u *= 2
                } while (s > 1);
                return t
            }

            function m(t, e, r, i, n) {
                return t = 32767 * (t - r) / n, e = 32767 * (e - i) / n, t = 16711935 & (t | t << 8), t = 252645135 & (t | t << 4), t = 858993459 & (t | t << 2), t = 1431655765 & (t | t << 1), e = 16711935 & (e | e << 8), e = 252645135 & (e | e << 4), e = 858993459 & (e | e << 2), e = 1431655765 & (e | e << 1), t | e << 1
            }

            function y(t) {
                var e = t,
                    r = t;
                do e.x < r.x && (r = e), e = e.next; while (e !== t);
                return r
            }

            function x(t, e, r, i, n, o, s, a) {
                return (n - s) * (e - a) - (t - s) * (o - a) >= 0 && (t - s) * (i - a) - (r - s) * (e - a) >= 0 && (r - s) * (o - a) - (n - s) * (i - a) >= 0
            }

            function b(t, e) {
                return T(t, e) || t.next.i !== e.i && t.prev.i !== e.i && !S(t, e) && w(t, e) && w(e, t) && A(t, e)
            }

            function _(t, e, r) {
                return (e.y - t.y) * (r.x - e.x) - (e.x - t.x) * (r.y - e.y)
            }

            function T(t, e) {
                return t.x === e.x && t.y === e.y
            }

            function E(t, e, r, i) {
                return _(t, e, r) > 0 != _(t, e, i) > 0 && _(r, i, t) > 0 != _(r, i, e) > 0
            }

            function S(t, e) {
                var r = t;
                do {
                    if (r.i !== t.i && r.next.i !== t.i && r.i !== e.i && r.next.i !== e.i && E(r, r.next, t, e)) return !0;
                    r = r.next
                } while (r !== t);
                return !1
            }

            function w(t, e) {
                return _(t.prev, t, t.next) < 0 ? _(t, e, t.next) >= 0 && _(t, t.prev, e) >= 0 : _(t, e, t.prev) < 0 || _(t, t.next, e) < 0
            }

            function A(t, e) {
                var r = t,
                    i = !1,
                    n = (t.x + e.x) / 2,
                    o = (t.y + e.y) / 2;
                do r.y > o != r.next.y > o && n < (r.next.x - r.x) * (o - r.y) / (r.next.y - r.y) + r.x && (i = !i), r = r.next; while (r !== t);
                return i
            }

            function C(t, e) {
                var r = new O(t.i, t.x, t.y),
                    i = new O(e.i, e.x, e.y),
                    n = t.next,
                    o = e.prev;
                return t.next = e, e.prev = t, r.next = n, n.prev = r, i.next = r, r.prev = i, o.next = i, i.prev = o, i
            }

            function R(t, e, r, i) {
                var n = new O(t, e, r);
                return i ? (n.next = i.next, n.prev = i, i.next.prev = n, i.next = n) : (n.prev = n, n.next = n), n
            }

            function M(t) {
                t.next.prev = t.prev, t.prev.next = t.next, t.prevZ && (t.prevZ.nextZ = t.nextZ), t.nextZ && (t.nextZ.prevZ = t.prevZ)
            }

            function O(t, e, r) {
                this.i = t, this.x = e, this.y = r, this.prev = null, this.next = null, this.z = null, this.prevZ = null, this.nextZ = null, this.steiner = !1
            }
            e.exports = i
        }, {}],
        10: [function(t, e, r) {
            "use strict";

            function i(t, e, r) {
                this.fn = t, this.context = e, this.once = r || !1
            }

            function n() {}
            var o = "function" != typeof Object.create ? "~" : !1;
            n.prototype._events = void 0, n.prototype.listeners = function(t, e) {
                var r = o ? o + t : t,
                    i = this._events && this._events[r];
                if (e) return !!i;
                if (!i) return [];
                if (i.fn) return [i.fn];
                for (var n = 0, s = i.length, a = new Array(s); s > n; n++) a[n] = i[n].fn;
                return a
            }, n.prototype.emit = function(t, e, r, i, n, s) {
                var a = o ? o + t : t;
                if (!this._events || !this._events[a]) return !1;
                var h, u, l = this._events[a],
                    c = arguments.length;
                if ("function" == typeof l.fn) {
                    switch (l.once && this.removeListener(t, l.fn, void 0, !0), c) {
                        case 1:
                            return l.fn.call(l.context), !0;
                        case 2:
                            return l.fn.call(l.context, e), !0;
                        case 3:
                            return l.fn.call(l.context, e, r), !0;
                        case 4:
                            return l.fn.call(l.context, e, r, i), !0;
                        case 5:
                            return l.fn.call(l.context, e, r, i, n), !0;
                        case 6:
                            return l.fn.call(l.context, e, r, i, n, s), !0
                    }
                    for (u = 1, h = new Array(c - 1); c > u; u++) h[u - 1] = arguments[u];
                    l.fn.apply(l.context, h)
                } else {
                    var p, d = l.length;
                    for (u = 0; d > u; u++) switch (l[u].once && this.removeListener(t, l[u].fn, void 0, !0), c) {
                        case 1:
                            l[u].fn.call(l[u].context);
                            break;
                        case 2:
                            l[u].fn.call(l[u].context, e);
                            break;
                        case 3:
                            l[u].fn.call(l[u].context, e, r);
                            break;
                        default:
                            if (!h)
                                for (p = 1, h = new Array(c - 1); c > p; p++) h[p - 1] = arguments[p];
                            l[u].fn.apply(l[u].context, h)
                    }
                }
                return !0
            }, n.prototype.on = function(t, e, r) {
                var n = new i(e, r || this),
                    s = o ? o + t : t;
                return this._events || (this._events = o ? {} : Object.create(null)), this._events[s] ? this._events[s].fn ? this._events[s] = [this._events[s], n] : this._events[s].push(n) : this._events[s] = n, this
            }, n.prototype.once = function(t, e, r) {
                var n = new i(e, r || this, !0),
                    s = o ? o + t : t;
                return this._events || (this._events = o ? {} : Object.create(null)), this._events[s] ? this._events[s].fn ? this._events[s] = [this._events[s], n] : this._events[s].push(n) : this._events[s] = n, this
            }, n.prototype.removeListener = function(t, e, r, i) {
                var n = o ? o + t : t;
                if (!this._events || !this._events[n]) return this;
                var s = this._events[n],
                    a = [];
                if (e)
                    if (s.fn)(s.fn !== e || i && !s.once || r && s.context !== r) && a.push(s);
                    else
                        for (var h = 0, u = s.length; u > h; h++)(s[h].fn !== e || i && !s[h].once || r && s[h].context !== r) && a.push(s[h]);
                return a.length ? this._events[n] = 1 === a.length ? a[0] : a : delete this._events[n], this
            }, n.prototype.removeAllListeners = function(t) {
                return this._events ? (t ? delete this._events[o ? o + t : t] : this._events = o ? {} : Object.create(null), this) : this
            }, n.prototype.off = n.prototype.removeListener, n.prototype.addListener = n.prototype.on, n.prototype.setMaxListeners = function() {
                return this
            }, n.prefixed = o, "undefined" != typeof e && (e.exports = n)
        }, {}],
        11: [function(t, e, r) {
            "use strict";

            function i(t) {
                if (null === t || void 0 === t) throw new TypeError("Object.assign cannot be called with null or undefined");
                return Object(t)
            }
            var n = Object.prototype.hasOwnProperty,
                o = Object.prototype.propertyIsEnumerable;
            e.exports = Object.assign || function(t, e) {
                for (var r, s, a = i(t), h = 1; h < arguments.length; h++) {
                    r = Object(arguments[h]);
                    for (var u in r) n.call(r, u) && (a[u] = r[u]);
                    if (Object.getOwnPropertySymbols) {
                        s = Object.getOwnPropertySymbols(r);
                        for (var l = 0; l < s.length; l++) o.call(r, s[l]) && (a[s[l]] = r[s[l]])
                    }
                }
                return a
            }
        }, {}],
        12: [function(e, r, i) {
            (function(e) {
                ! function() {
                    function i(t) {
                        var e = !1;
                        return function() {
                            if (e) throw new Error("Callback was already called.");
                            e = !0, t.apply(n, arguments)
                        }
                    }
                    var n, o, s = {};
                    n = this, null != n && (o = n.async), s.noConflict = function() {
                        return n.async = o, s
                    };
                    var a = Object.prototype.toString,
                        h = Array.isArray || function(t) {
                            return "[object Array]" === a.call(t)
                        },
                        u = function(t, e) {
                            for (var r = 0; r < t.length; r += 1) e(t[r], r, t)
                        },
                        l = function(t, e) {
                            if (t.map) return t.map(e);
                            var r = [];
                            return u(t, function(t, i, n) {
                                r.push(e(t, i, n))
                            }), r
                        },
                        c = function(t, e, r) {
                            return t.reduce ? t.reduce(e, r) : (u(t, function(t, i, n) {
                                r = e(r, t, i, n)
                            }), r)
                        },
                        p = function(t) {
                            if (Object.keys) return Object.keys(t);
                            var e = [];
                            for (var r in t) t.hasOwnProperty(r) && e.push(r);
                            return e
                        };
                    "undefined" != typeof e && e.nextTick ? (s.nextTick = e.nextTick, "undefined" != typeof setImmediate ? s.setImmediate = function(t) {
                        setImmediate(t)
                    } : s.setImmediate = s.nextTick) : "function" == typeof setImmediate ? (s.nextTick = function(t) {
                        setImmediate(t)
                    }, s.setImmediate = s.nextTick) : (s.nextTick = function(t) {
                        setTimeout(t, 0)
                    }, s.setImmediate = s.nextTick), s.each = function(t, e, r) {
                        function n(e) {
                            e ? (r(e), r = function() {}) : (o += 1, o >= t.length && r())
                        }
                        if (r = r || function() {}, !t.length) return r();
                        var o = 0;
                        u(t, function(t) {
                            e(t, i(n))
                        })
                    }, s.forEach = s.each, s.eachSeries = function(t, e, r) {
                        if (r = r || function() {}, !t.length) return r();
                        var i = 0,
                            n = function() {
                                e(t[i], function(e) {
                                    e ? (r(e), r = function() {}) : (i += 1, i >= t.length ? r() : n())
                                })
                            };
                        n()
                    }, s.forEachSeries = s.eachSeries, s.eachLimit = function(t, e, r, i) {
                        var n = d(e);
                        n.apply(null, [t, r, i])
                    }, s.forEachLimit = s.eachLimit;
                    var d = function(t) {
                            return function(e, r, i) {
                                if (i = i || function() {}, !e.length || 0 >= t) return i();
                                var n = 0,
                                    o = 0,
                                    s = 0;
                                ! function a() {
                                    if (n >= e.length) return i();
                                    for (; t > s && o < e.length;) o += 1, s += 1, r(e[o - 1], function(t) {
                                        t ? (i(t), i = function() {}) : (n += 1, s -= 1, n >= e.length ? i() : a())
                                    })
                                }()
                            }
                        },
                        f = function(t) {
                            return function() {
                                var e = Array.prototype.slice.call(arguments);
                                return t.apply(null, [s.each].concat(e))
                            }
                        },
                        v = function(t, e) {
                            return function() {
                                var r = Array.prototype.slice.call(arguments);
                                return e.apply(null, [d(t)].concat(r))
                            }
                        },
                        g = function(t) {
                            return function() {
                                var e = Array.prototype.slice.call(arguments);
                                return t.apply(null, [s.eachSeries].concat(e))
                            }
                        },
                        m = function(t, e, r, i) {
                            if (e = l(e, function(t, e) {
                                    return {
                                        index: e,
                                        value: t
                                    }
                                }), i) {
                                var n = [];
                                t(e, function(t, e) {
                                    r(t.value, function(r, i) {
                                        n[t.index] = i, e(r)
                                    })
                                }, function(t) {
                                    i(t, n)
                                })
                            } else t(e, function(t, e) {
                                r(t.value, function(t) {
                                    e(t)
                                })
                            })
                        };
                    s.map = f(m), s.mapSeries = g(m), s.mapLimit = function(t, e, r, i) {
                        return y(e)(t, r, i)
                    };
                    var y = function(t) {
                        return v(t, m)
                    };
                    s.reduce = function(t, e, r, i) {
                        s.eachSeries(t, function(t, i) {
                            r(e, t, function(t, r) {
                                e = r, i(t)
                            })
                        }, function(t) {
                            i(t, e)
                        })
                    }, s.inject = s.reduce, s.foldl = s.reduce, s.reduceRight = function(t, e, r, i) {
                        var n = l(t, function(t) {
                            return t
                        }).reverse();
                        s.reduce(n, e, r, i)
                    }, s.foldr = s.reduceRight;
                    var x = function(t, e, r, i) {
                        var n = [];
                        e = l(e, function(t, e) {
                            return {
                                index: e,
                                value: t
                            }
                        }), t(e, function(t, e) {
                            r(t.value, function(r) {
                                r && n.push(t), e()
                            })
                        }, function(t) {
                            i(l(n.sort(function(t, e) {
                                return t.index - e.index
                            }), function(t) {
                                return t.value
                            }))
                        })
                    };
                    s.filter = f(x), s.filterSeries = g(x), s.select = s.filter, s.selectSeries = s.filterSeries;
                    var b = function(t, e, r, i) {
                        var n = [];
                        e = l(e, function(t, e) {
                            return {
                                index: e,
                                value: t
                            }
                        }), t(e, function(t, e) {
                            r(t.value, function(r) {
                                r || n.push(t), e()
                            })
                        }, function(t) {
                            i(l(n.sort(function(t, e) {
                                return t.index - e.index
                            }), function(t) {
                                return t.value
                            }))
                        })
                    };
                    s.reject = f(b), s.rejectSeries = g(b);
                    var _ = function(t, e, r, i) {
                        t(e, function(t, e) {
                            r(t, function(r) {
                                r ? (i(t), i = function() {}) : e()
                            })
                        }, function(t) {
                            i()
                        })
                    };
                    s.detect = f(_), s.detectSeries = g(_), s.some = function(t, e, r) {
                        s.each(t, function(t, i) {
                            e(t, function(t) {
                                t && (r(!0), r = function() {}), i()
                            })
                        }, function(t) {
                            r(!1)
                        })
                    }, s.any = s.some, s.every = function(t, e, r) {
                        s.each(t, function(t, i) {
                            e(t, function(t) {
                                t || (r(!1), r = function() {}), i()
                            })
                        }, function(t) {
                            r(!0)
                        })
                    }, s.all = s.every, s.sortBy = function(t, e, r) {
                        s.map(t, function(t, r) {
                            e(t, function(e, i) {
                                e ? r(e) : r(null, {
                                    value: t,
                                    criteria: i
                                })
                            })
                        }, function(t, e) {
                            if (t) return r(t);
                            var i = function(t, e) {
                                var r = t.criteria,
                                    i = e.criteria;
                                return i > r ? -1 : r > i ? 1 : 0
                            };
                            r(null, l(e.sort(i), function(t) {
                                return t.value
                            }))
                        })
                    }, s.auto = function(t, e) {
                        e = e || function() {};
                        var r = p(t),
                            i = r.length;
                        if (!i) return e();
                        var n = {},
                            o = [],
                            a = function(t) {
                                o.unshift(t)
                            },
                            l = function(t) {
                                for (var e = 0; e < o.length; e += 1)
                                    if (o[e] === t) return void o.splice(e, 1)
                            },
                            d = function() {
                                i--, u(o.slice(0), function(t) {
                                    t()
                                })
                            };
                        a(function() {
                            if (!i) {
                                var t = e;
                                e = function() {}, t(null, n)
                            }
                        }), u(r, function(r) {
                            var i = h(t[r]) ? t[r] : [t[r]],
                                o = function(t) {
                                    var i = Array.prototype.slice.call(arguments, 1);
                                    if (i.length <= 1 && (i = i[0]), t) {
                                        var o = {};
                                        u(p(n), function(t) {
                                            o[t] = n[t]
                                        }), o[r] = i, e(t, o), e = function() {}
                                    } else n[r] = i, s.setImmediate(d)
                                },
                                f = i.slice(0, Math.abs(i.length - 1)) || [],
                                v = function() {
                                    return c(f, function(t, e) {
                                        return t && n.hasOwnProperty(e)
                                    }, !0) && !n.hasOwnProperty(r)
                                };
                            if (v()) i[i.length - 1](o, n);
                            else {
                                var g = function() {
                                    v() && (l(g), i[i.length - 1](o, n))
                                };
                                a(g)
                            }
                        })
                    }, s.retry = function(t, e, r) {
                        var i = 5,
                            n = [];
                        "function" == typeof t && (r = e, e = t, t = i), t = parseInt(t, 10) || i;
                        var o = function(i, o) {
                            for (var a = function(t, e) {
                                    return function(r) {
                                        t(function(t, i) {
                                            r(!t || e, {
                                                err: t,
                                                result: i
                                            })
                                        }, o)
                                    }
                                }; t;) n.push(a(e, !(t -= 1)));
                            s.series(n, function(t, e) {
                                e = e[e.length - 1], (i || r)(e.err, e.result)
                            })
                        };
                        return r ? o() : o
                    }, s.waterfall = function(t, e) {
                        if (e = e || function() {}, !h(t)) {
                            var r = new Error("First argument to waterfall must be an array of functions");
                            return e(r)
                        }
                        if (!t.length) return e();
                        var i = function(t) {
                            return function(r) {
                                if (r) e.apply(null, arguments), e = function() {};
                                else {
                                    var n = Array.prototype.slice.call(arguments, 1),
                                        o = t.next();
                                    o ? n.push(i(o)) : n.push(e), s.setImmediate(function() {
                                        t.apply(null, n)
                                    })
                                }
                            }
                        };
                        i(s.iterator(t))()
                    };
                    var T = function(t, e, r) {
                        if (r = r || function() {}, h(e)) t.map(e, function(t, e) {
                            t && t(function(t) {
                                var r = Array.prototype.slice.call(arguments, 1);
                                r.length <= 1 && (r = r[0]), e.call(null, t, r)
                            })
                        }, r);
                        else {
                            var i = {};
                            t.each(p(e), function(t, r) {
                                e[t](function(e) {
                                    var n = Array.prototype.slice.call(arguments, 1);
                                    n.length <= 1 && (n = n[0]), i[t] = n, r(e)
                                })
                            }, function(t) {
                                r(t, i)
                            })
                        }
                    };
                    s.parallel = function(t, e) {
                        T({
                            map: s.map,
                            each: s.each
                        }, t, e)
                    }, s.parallelLimit = function(t, e, r) {
                        T({
                            map: y(e),
                            each: d(e)
                        }, t, r)
                    }, s.series = function(t, e) {
                        if (e = e || function() {}, h(t)) s.mapSeries(t, function(t, e) {
                            t && t(function(t) {
                                var r = Array.prototype.slice.call(arguments, 1);
                                r.length <= 1 && (r = r[0]), e.call(null, t, r)
                            })
                        }, e);
                        else {
                            var r = {};
                            s.eachSeries(p(t), function(e, i) {
                                t[e](function(t) {
                                    var n = Array.prototype.slice.call(arguments, 1);
                                    n.length <= 1 && (n = n[0]), r[e] = n, i(t)
                                })
                            }, function(t) {
                                e(t, r)
                            })
                        }
                    }, s.iterator = function(t) {
                        var e = function(r) {
                            var i = function() {
                                return t.length && t[r].apply(null, arguments), i.next()
                            };
                            return i.next = function() {
                                return r < t.length - 1 ? e(r + 1) : null
                            }, i
                        };
                        return e(0)
                    }, s.apply = function(t) {
                        var e = Array.prototype.slice.call(arguments, 1);
                        return function() {
                            return t.apply(null, e.concat(Array.prototype.slice.call(arguments)))
                        }
                    };
                    var E = function(t, e, r, i) {
                        var n = [];
                        t(e, function(t, e) {
                            r(t, function(t, r) {
                                n = n.concat(r || []), e(t)
                            })
                        }, function(t) {
                            i(t, n)
                        })
                    };
                    s.concat = f(E), s.concatSeries = g(E), s.whilst = function(t, e, r) {
                        t() ? e(function(i) {
                            return i ? r(i) : void s.whilst(t, e, r)
                        }) : r()
                    }, s.doWhilst = function(t, e, r) {
                        t(function(i) {
                            if (i) return r(i);
                            var n = Array.prototype.slice.call(arguments, 1);
                            e.apply(null, n) ? s.doWhilst(t, e, r) : r()
                        })
                    }, s.until = function(t, e, r) {
                        t() ? r() : e(function(i) {
                            return i ? r(i) : void s.until(t, e, r)
                        })
                    }, s.doUntil = function(t, e, r) {
                        t(function(i) {
                            if (i) return r(i);
                            var n = Array.prototype.slice.call(arguments, 1);
                            e.apply(null, n) ? r() : s.doUntil(t, e, r)
                        })
                    }, s.queue = function(t, e) {
                        function r(t, e, r, i) {
                            return t.started || (t.started = !0), h(e) || (e = [e]), 0 == e.length ? s.setImmediate(function() {
                                t.drain && t.drain()
                            }) : void u(e, function(e) {
                                var n = {
                                    data: e,
                                    callback: "function" == typeof i ? i : null
                                };
                                r ? t.tasks.unshift(n) : t.tasks.push(n), t.saturated && t.tasks.length === t.concurrency && t.saturated(), s.setImmediate(t.process)
                            })
                        }
                        void 0 === e && (e = 1);
                        var n = 0,
                            o = {
                                tasks: [],
                                concurrency: e,
                                saturated: null,
                                empty: null,
                                drain: null,
                                started: !1,
                                paused: !1,
                                push: function(t, e) {
                                    r(o, t, !1, e)
                                },
                                kill: function() {
                                    o.drain = null, o.tasks = []
                                },
                                unshift: function(t, e) {
                                    r(o, t, !0, e)
                                },
                                process: function() {
                                    if (!o.paused && n < o.concurrency && o.tasks.length) {
                                        var e = o.tasks.shift();
                                        o.empty && 0 === o.tasks.length && o.empty(), n += 1;
                                        var r = function() {
                                                n -= 1, e.callback && e.callback.apply(e, arguments), o.drain && o.tasks.length + n === 0 && o.drain(), o.process()
                                            },
                                            s = i(r);
                                        t(e.data, s)
                                    }
                                },
                                length: function() {
                                    return o.tasks.length
                                },
                                running: function() {
                                    return n
                                },
                                idle: function() {
                                    return o.tasks.length + n === 0
                                },
                                pause: function() {
                                    o.paused !== !0 && (o.paused = !0)
                                },
                                resume: function() {
                                    if (o.paused !== !1) {
                                        o.paused = !1;
                                        for (var t = 1; t <= o.concurrency; t++) s.setImmediate(o.process)
                                    }
                                }
                            };
                        return o
                    }, s.priorityQueue = function(t, e) {
                        function r(t, e) {
                            return t.priority - e.priority
                        }

                        function i(t, e, r) {
                            for (var i = -1, n = t.length - 1; n > i;) {
                                var o = i + (n - i + 1 >>> 1);
                                r(e, t[o]) >= 0 ? i = o : n = o - 1
                            }
                            return i
                        }

                        function n(t, e, n, o) {
                            return t.started || (t.started = !0), h(e) || (e = [e]), 0 == e.length ? s.setImmediate(function() {
                                t.drain && t.drain()
                            }) : void u(e, function(e) {
                                var a = {
                                    data: e,
                                    priority: n,
                                    callback: "function" == typeof o ? o : null
                                };
                                t.tasks.splice(i(t.tasks, a, r) + 1, 0, a), t.saturated && t.tasks.length === t.concurrency && t.saturated(), s.setImmediate(t.process)
                            })
                        }
                        var o = s.queue(t, e);
                        return o.push = function(t, e, r) {
                            n(o, t, e, r)
                        }, delete o.unshift, o
                    }, s.cargo = function(t, e) {
                        var r = !1,
                            i = [],
                            n = {
                                tasks: i,
                                payload: e,
                                saturated: null,
                                empty: null,
                                drain: null,
                                drained: !0,
                                push: function(t, r) {
                                    h(t) || (t = [t]), u(t, function(t) {
                                        i.push({
                                            data: t,
                                            callback: "function" == typeof r ? r : null
                                        }), n.drained = !1, n.saturated && i.length === e && n.saturated()
                                    }), s.setImmediate(n.process)
                                },
                                process: function o() {
                                    if (!r) {
                                        if (0 === i.length) return n.drain && !n.drained && n.drain(), void(n.drained = !0);
                                        var s = "number" == typeof e ? i.splice(0, e) : i.splice(0, i.length),
                                            a = l(s, function(t) {
                                                return t.data
                                            });
                                        n.empty && n.empty(), r = !0, t(a, function() {
                                            r = !1;
                                            var t = arguments;
                                            u(s, function(e) {
                                                e.callback && e.callback.apply(null, t)
                                            }), o()
                                        })
                                    }
                                },
                                length: function() {
                                    return i.length
                                },
                                running: function() {
                                    return r
                                }
                            };
                        return n
                    };
                    var S = function(t) {
                        return function(e) {
                            var r = Array.prototype.slice.call(arguments, 1);
                            e.apply(null, r.concat([function(e) {
                                var r = Array.prototype.slice.call(arguments, 1);
                                "undefined" != typeof console && (e ? console.error && console.error(e) : console[t] && u(r, function(e) {
                                    console[t](e)
                                }))
                            }]))
                        }
                    };
                    s.log = S("log"), s.dir = S("dir"), s.memoize = function(t, e) {
                        var r = {},
                            i = {};
                        e = e || function(t) {
                            return t
                        };
                        var n = function() {
                            var n = Array.prototype.slice.call(arguments),
                                o = n.pop(),
                                a = e.apply(null, n);
                            a in r ? s.nextTick(function() {
                                o.apply(null, r[a])
                            }) : a in i ? i[a].push(o) : (i[a] = [o], t.apply(null, n.concat([function() {
                                r[a] = arguments;
                                var t = i[a];
                                delete i[a];
                                for (var e = 0, n = t.length; n > e; e++) t[e].apply(null, arguments)
                            }])))
                        };
                        return n.memo = r, n.unmemoized = t, n
                    }, s.unmemoize = function(t) {
                        return function() {
                            return (t.unmemoized || t).apply(null, arguments)
                        }
                    }, s.times = function(t, e, r) {
                        for (var i = [], n = 0; t > n; n++) i.push(n);
                        return s.map(i, e, r)
                    }, s.timesSeries = function(t, e, r) {
                        for (var i = [], n = 0; t > n; n++) i.push(n);
                        return s.mapSeries(i, e, r)
                    }, s.seq = function() {
                        var t = arguments;
                        return function() {
                            var e = this,
                                r = Array.prototype.slice.call(arguments),
                                i = r.pop();
                            s.reduce(t, r, function(t, r, i) {
                                r.apply(e, t.concat([function() {
                                    var t = arguments[0],
                                        e = Array.prototype.slice.call(arguments, 1);
                                    i(t, e)
                                }]))
                            }, function(t, r) {
                                i.apply(e, [t].concat(r))
                            })
                        }
                    }, s.compose = function() {
                        return s.seq.apply(null, Array.prototype.reverse.call(arguments))
                    };
                    var w = function(t, e) {
                        var r = function() {
                            var r = this,
                                i = Array.prototype.slice.call(arguments),
                                n = i.pop();
                            return t(e, function(t, e) {
                                t.apply(r, i.concat([e]))
                            }, n)
                        };
                        if (arguments.length > 2) {
                            var i = Array.prototype.slice.call(arguments, 2);
                            return r.apply(this, i)
                        }
                        return r
                    };
                    s.applyEach = f(w), s.applyEachSeries = g(w), s.forever = function(t, e) {
                        function r(i) {
                            if (i) {
                                if (e) return e(i);
                                throw i
                            }
                            t(r)
                        }
                        r()
                    }, "undefined" != typeof r && r.exports ? r.exports = s : "undefined" != typeof t && t.amd ? t([], function() {
                        return s
                    }) : n.async = s
                }()
            }).call(this, e("_process"))
        }, {
            _process: 3
        }],
        13: [function(t, e, r) {
            function i(t, e) {
                a.call(this), e = e || 10, this.baseUrl = t || "", this.progress = 0, this.loading = !1, this._progressChunk = 0, this._beforeMiddleware = [], this._afterMiddleware = [], this._boundLoadResource = this._loadResource.bind(this), this._boundOnLoad = this._onLoad.bind(this), this._buffer = [], this._numToLoad = 0, this._queue = n.queue(this._boundLoadResource, e), this.resources = {}
            }
            var n = t("async"),
                o = t("url"),
                s = t("./Resource"),
                a = t("eventemitter3");
            i.prototype = Object.create(a.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.add = i.prototype.enqueue = function(t, e, r, i) {
                if (Array.isArray(t)) {
                    for (var n = 0; n < t.length; ++n) this.add(t[n]);
                    return this
                }
                if ("object" == typeof t && (i = e || t.callback || t.onComplete, r = t, e = t.url, t = t.name || t.key || t.url), "string" != typeof e && (i = r, r = e, e = t), "string" != typeof e) throw new Error("No url passed to add resource to loader.");
                if ("function" == typeof r && (i = r, r = null), this.resources[t]) throw new Error('Resource with name "' + t + '" already exists.');
                return e = this._handleBaseUrl(e), this.resources[t] = new s(t, e, r), "function" == typeof i && this.resources[t].once("afterMiddleware", i), this._numToLoad++, this._queue.started ? (this._queue.push(this.resources[t]), this._progressChunk = (100 - this.progress) / (this._queue.length() + this._queue.running())) : (this._buffer.push(this.resources[t]), this._progressChunk = 100 / this._buffer.length), this
            }, i.prototype._handleBaseUrl = function(t) {
                var e = o.parse(t);
                return e.protocol || 0 === e.pathname.indexOf("//") ? t : this.baseUrl.length && this.baseUrl.lastIndexOf("/") !== this.baseUrl.length - 1 && t.lastIndexOf("/") !== t.length - 1 ? this.baseUrl + "/" + t : this.baseUrl + t
            }, i.prototype.before = i.prototype.pre = function(t) {
                return this._beforeMiddleware.push(t), this
            }, i.prototype.after = i.prototype.use = function(t) {
                return this._afterMiddleware.push(t), this
            }, i.prototype.reset = function() {
                this.progress = 0, this.loading = !1, this._progressChunk = 0, this._buffer.length = 0, this._numToLoad = 0, this._queue.kill(), this._queue.started = !1, this.resources = {}
            }, i.prototype.load = function(t) {
                if ("function" == typeof t && this.once("complete", t), this._queue.started) return this;
                this.emit("start", this);
                for (var e = 0; e < this._buffer.length; ++e) this._queue.push(this._buffer[e]);
                return this._buffer.length = 0, this
            }, i.prototype._loadResource = function(t, e) {
                var r = this;
                t._dequeue = e, this._runMiddleware(t, this._beforeMiddleware, function() {
                    t.load(r._boundOnLoad)
                })
            }, i.prototype._onComplete = function() {
                this.emit("complete", this, this.resources)
            }, i.prototype._onLoad = function(t) {
                this.progress += this._progressChunk, this.emit("progress", this, t), this._runMiddleware(t, this._afterMiddleware, function() {
                    t.emit("afterMiddleware", t), this._numToLoad--, 0 === this._numToLoad && (this.progress = 100, this._onComplete()), t.error ? this.emit("error", t.error, this, t) : this.emit("load", this, t)
                }), t._dequeue()
            }, i.prototype._runMiddleware = function(t, e, r) {
                var i = this;
                n.eachSeries(e, function(e, r) {
                    e.call(i, t, r)
                }, r.bind(this, t))
            }, i.LOAD_TYPE = s.LOAD_TYPE, i.XHR_READY_STATE = s.XHR_READY_STATE, i.XHR_RESPONSE_TYPE = s.XHR_RESPONSE_TYPE
        }, {
            "./Resource": 14,
            async: 12,
            eventemitter3: 10,
            url: 8
        }],
        14: [function(t, e, r) {
            function i(t, e, r) {
                if (s.call(this), r = r || {}, "string" != typeof t || "string" != typeof e) throw new Error("Both name and url are required for constructing a resource.");
                this.name = t, this.url = e, this.isDataUrl = 0 === this.url.indexOf("data:"), this.data = null, this.crossOrigin = r.crossOrigin === !0 ? "anonymous" : null, this.loadType = r.loadType || this._determineLoadType(), this.xhrType = r.xhrType, this.error = null, this.xhr = null, this.isJson = !1, this.isXml = !1, this.isImage = !1, this.isAudio = !1, this.isVideo = !1, this._dequeue = null, this._boundComplete = this.complete.bind(this), this._boundOnError = this._onError.bind(this), this._boundOnProgress = this._onProgress.bind(this), this._boundXhrOnError = this._xhrOnError.bind(this), this._boundXhrOnAbort = this._xhrOnAbort.bind(this), this._boundXhrOnLoad = this._xhrOnLoad.bind(this), this._boundXdrOnTimeout = this._xdrOnTimeout.bind(this)
            }

            function n(t) {
                return t.toString().replace("object ", "")
            }

            function o(t, e, r) {
                e && 0 === e.indexOf(".") && (e = e.substring(1)), e && (t[e] = r)
            }
            var s = t("eventemitter3"),
                a = t("url"),
                h = !(!window.XDomainRequest || "withCredentials" in new XMLHttpRequest),
                u = null;
            i.prototype = Object.create(s.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.complete = function() {
                this.data && this.data.removeEventListener && (this.data.removeEventListener("error", this._boundOnError), this.data.removeEventListener("load", this._boundComplete), this.data.removeEventListener("progress", this._boundOnProgress), this.data.removeEventListener("canplaythrough", this._boundComplete)), this.xhr && (this.xhr.removeEventListener ? (this.xhr.removeEventListener("error", this._boundXhrOnError), this.xhr.removeEventListener("abort", this._boundXhrOnAbort), this.xhr.removeEventListener("progress", this._boundOnProgress), this.xhr.removeEventListener("load", this._boundXhrOnLoad)) : (this.xhr.onerror = null, this.xhr.ontimeout = null, this.xhr.onprogress = null, this.xhr.onload = null)), this.emit("complete", this)
            }, i.prototype.load = function(t) {
                switch (this.emit("start", this), t && this.once("complete", t), "string" != typeof this.crossOrigin && (this.crossOrigin = this._determineCrossOrigin(this.url)), this.loadType) {
                    case i.LOAD_TYPE.IMAGE:
                        this._loadImage();
                        break;
                    case i.LOAD_TYPE.AUDIO:
                        this._loadElement("audio");
                        break;
                    case i.LOAD_TYPE.VIDEO:
                        this._loadElement("video");
                        break;
                    case i.LOAD_TYPE.XHR:
                    default:
                        h && this.crossOrigin ? this._loadXdr() : this._loadXhr()
                }
            }, i.prototype._loadImage = function() {
                this.data = new Image, this.crossOrigin && (this.data.crossOrigin = this.crossOrigin), this.data.src = this.url, this.isImage = !0, this.data.addEventListener("error", this._boundOnError, !1), this.data.addEventListener("load", this._boundComplete, !1), this.data.addEventListener("progress", this._boundOnProgress, !1)
            }, i.prototype._loadElement = function(t) {
                if ("audio" === t && "undefined" != typeof Audio ? this.data = new Audio : this.data = document.createElement(t), null === this.data) return this.error = new Error("Unsupported element " + t), void this.complete();
                if (navigator.isCocoonJS) this.data.src = Array.isArray(this.url) ? this.url[0] : this.url;
                else if (Array.isArray(this.url))
                    for (var e = 0; e < this.url.length; ++e) this.data.appendChild(this._createSource(t, this.url[e]));
                else this.data.appendChild(this._createSource(t, this.url));
                this["is" + t[0].toUpperCase() + t.substring(1)] = !0, this.data.addEventListener("error", this._boundOnError, !1), this.data.addEventListener("load", this._boundComplete, !1), this.data.addEventListener("progress", this._boundOnProgress, !1), this.data.addEventListener("canplaythrough", this._boundComplete, !1), this.data.load()
            }, i.prototype._loadXhr = function() {
                "string" != typeof this.xhrType && (this.xhrType = this._determineXhrType());
                var t = this.xhr = new XMLHttpRequest;
                t.open("GET", this.url, !0), this.xhrType === i.XHR_RESPONSE_TYPE.JSON || this.xhrType === i.XHR_RESPONSE_TYPE.DOCUMENT ? t.responseType = i.XHR_RESPONSE_TYPE.TEXT : t.responseType = this.xhrType, t.addEventListener("error", this._boundXhrOnError, !1), t.addEventListener("abort", this._boundXhrOnAbort, !1), t.addEventListener("progress", this._boundOnProgress, !1), t.addEventListener("load", this._boundXhrOnLoad, !1), t.send()
            }, i.prototype._loadXdr = function() {
                "string" != typeof this.xhrType && (this.xhrType = this._determineXhrType());
                var t = this.xhr = new XDomainRequest;
                t.timeout = 5e3, t.onerror = this._boundXhrOnError, t.ontimeout = this._boundXdrOnTimeout, t.onprogress = this._boundOnProgress, t.onload = this._boundXhrOnLoad, t.open("GET", this.url, !0), setTimeout(function() {
                    t.send()
                }, 0)
            }, i.prototype._createSource = function(t, e, r) {
                r || (r = t + "/" + e.substr(e.lastIndexOf(".") + 1));
                var i = document.createElement("source");
                return i.src = e, i.type = r, i
            }, i.prototype._onError = function(t) {
                this.error = new Error("Failed to load element using " + t.target.nodeName), this.complete()
            }, i.prototype._onProgress = function(t) {
                t && t.lengthComputable && this.emit("progress", this, t.loaded / t.total)
            }, i.prototype._xhrOnError = function() {
                this.error = new Error(n(this.xhr) + " Request failed. Status: " + this.xhr.status + ', text: "' + this.xhr.statusText + '"'), this.complete()
            }, i.prototype._xhrOnAbort = function() {
                this.error = new Error(n(this.xhr) + " Request was aborted by the user."), this.complete()
            }, i.prototype._xdrOnTimeout = function() {
                this.error = new Error(n(this.xhr) + " Request timed out."), this.complete()
            }, i.prototype._xhrOnLoad = function() {
                var t = this.xhr,
                    e = void 0 !== t.status ? t.status : 200;
                if (200 === e || 204 === e || 0 === e && t.responseText.length > 0)
                    if (this.xhrType === i.XHR_RESPONSE_TYPE.TEXT) this.data = t.responseText;
                    else if (this.xhrType === i.XHR_RESPONSE_TYPE.JSON) try {
                        this.data = JSON.parse(t.responseText), this.isJson = !0
                    } catch (r) {
                        this.error = new Error("Error trying to parse loaded json:", r)
                    } else if (this.xhrType === i.XHR_RESPONSE_TYPE.DOCUMENT) try {
                        if (window.DOMParser) {
                            var n = new DOMParser;
                            this.data = n.parseFromString(t.responseText, "text/xml")
                        } else {
                            var o = document.createElement("div");
                            o.innerHTML = t.responseText, this.data = o
                        }
                        this.isXml = !0
                    } catch (r) {
                        this.error = new Error("Error trying to parse loaded xml:", r)
                    } else this.data = t.response || t.responseText;
                    else this.error = new Error("[" + t.status + "]" + t.statusText + ":" + t.responseURL);
                this.complete()
            }, i.prototype._determineCrossOrigin = function(t, e) {
                if (0 === t.indexOf("data:")) return "";
                e = e || window.location, u || (u = document.createElement("a")), u.href = t, t = a.parse(u.href);
                var r = !t.port && "" === e.port || t.port === e.port;
                return t.hostname === e.hostname && r && t.protocol === e.protocol ? "" : "anonymous"
            }, i.prototype._determineXhrType = function() {
                return i._xhrTypeMap[this._getExtension()] || i.XHR_RESPONSE_TYPE.TEXT
            }, i.prototype._determineLoadType = function() {
                return i._loadTypeMap[this._getExtension()] || i.LOAD_TYPE.XHR
            }, i.prototype._getExtension = function() {
                var t, e = this.url;
                if (this.isDataUrl) {
                    var r = e.indexOf("/");
                    t = e.substring(r + 1, e.indexOf(";", r))
                } else {
                    var i = e.indexOf("?"); - 1 !== i && (e = e.substring(0, i)), t = e.substring(e.lastIndexOf(".") + 1)
                }
                return t
            }, i.prototype._getMimeFromXhrType = function(t) {
                switch (t) {
                    case i.XHR_RESPONSE_TYPE.BUFFER:
                        return "application/octet-binary";
                    case i.XHR_RESPONSE_TYPE.BLOB:
                        return "application/blob";
                    case i.XHR_RESPONSE_TYPE.DOCUMENT:
                        return "application/xml";
                    case i.XHR_RESPONSE_TYPE.JSON:
                        return "application/json";
                    case i.XHR_RESPONSE_TYPE.DEFAULT:
                    case i.XHR_RESPONSE_TYPE.TEXT:
                    default:
                        return "text/plain"
                }
            }, i.LOAD_TYPE = {
                XHR: 1,
                IMAGE: 2,
                AUDIO: 3,
                VIDEO: 4
            }, i.XHR_READY_STATE = {
                UNSENT: 0,
                OPENED: 1,
                HEADERS_RECEIVED: 2,
                LOADING: 3,
                DONE: 4
            }, i.XHR_RESPONSE_TYPE = {
                DEFAULT: "text",
                BUFFER: "arraybuffer",
                BLOB: "blob",
                DOCUMENT: "document",
                JSON: "json",
                TEXT: "text"
            }, i._loadTypeMap = {
                gif: i.LOAD_TYPE.IMAGE,
                png: i.LOAD_TYPE.IMAGE,
                bmp: i.LOAD_TYPE.IMAGE,
                jpg: i.LOAD_TYPE.IMAGE,
                jpeg: i.LOAD_TYPE.IMAGE,
                tif: i.LOAD_TYPE.IMAGE,
                tiff: i.LOAD_TYPE.IMAGE,
                webp: i.LOAD_TYPE.IMAGE,
                tga: i.LOAD_TYPE.IMAGE
            }, i._xhrTypeMap = {
                xhtml: i.XHR_RESPONSE_TYPE.DOCUMENT,
                html: i.XHR_RESPONSE_TYPE.DOCUMENT,
                htm: i.XHR_RESPONSE_TYPE.DOCUMENT,
                xml: i.XHR_RESPONSE_TYPE.DOCUMENT,
                tmx: i.XHR_RESPONSE_TYPE.DOCUMENT,
                tsx: i.XHR_RESPONSE_TYPE.DOCUMENT,
                svg: i.XHR_RESPONSE_TYPE.DOCUMENT,
                gif: i.XHR_RESPONSE_TYPE.BLOB,
                png: i.XHR_RESPONSE_TYPE.BLOB,
                bmp: i.XHR_RESPONSE_TYPE.BLOB,
                jpg: i.XHR_RESPONSE_TYPE.BLOB,
                jpeg: i.XHR_RESPONSE_TYPE.BLOB,
                tif: i.XHR_RESPONSE_TYPE.BLOB,
                tiff: i.XHR_RESPONSE_TYPE.BLOB,
                webp: i.XHR_RESPONSE_TYPE.BLOB,
                tga: i.XHR_RESPONSE_TYPE.BLOB,
                json: i.XHR_RESPONSE_TYPE.JSON,
                text: i.XHR_RESPONSE_TYPE.TEXT,
                txt: i.XHR_RESPONSE_TYPE.TEXT
            }, i.setExtensionLoadType = function(t, e) {
                o(i._loadTypeMap, t, e)
            }, i.setExtensionXhrType = function(t, e) {
                o(i._xhrTypeMap, t, e)
            }
        }, {
            eventemitter3: 10,
            url: 8
        }],
        15: [function(t, e, r) {
            e.exports = {
                _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                encodeBinary: function(t) {
                    for (var e, r = "", i = new Array(4), n = 0, o = 0, s = 0; n < t.length;) {
                        for (e = new Array(3), o = 0; o < e.length; o++) n < t.length ? e[o] = 255 & t.charCodeAt(n++) : e[o] = 0;
                        switch (i[0] = e[0] >> 2, i[1] = (3 & e[0]) << 4 | e[1] >> 4, i[2] = (15 & e[1]) << 2 | e[2] >> 6, i[3] = 63 & e[2], s = n - (t.length - 1)) {
                            case 2:
                                i[3] = 64, i[2] = 64;
                                break;
                            case 1:
                                i[3] = 64
                        }
                        for (o = 0; o < i.length; o++) r += this._keyStr.charAt(i[o])
                    }
                    return r
                }
            }
        }, {}],
        16: [function(t, e, r) {
            e.exports = t("./Loader"), e.exports.Resource = t("./Resource"), e.exports.middleware = {
                caching: {
                    memory: t("./middlewares/caching/memory")
                },
                parsing: {
                    blob: t("./middlewares/parsing/blob")
                }
            }
        }, {
            "./Loader": 13,
            "./Resource": 14,
            "./middlewares/caching/memory": 17,
            "./middlewares/parsing/blob": 18
        }],
        17: [function(t, e, r) {
            var i = {};
            e.exports = function() {
                return function(t, e) {
                    i[t.url] ? (t.data = i[t.url], t.complete()) : (t.once("complete", function() {
                        i[this.url] = this.data
                    }), e())
                }
            }
        }, {}],
        18: [function(t, e, r) {
            var i = t("../../Resource"),
                n = t("../../b64");
            window.URL = window.URL || window.webkitURL, e.exports = function() {
                return function(t, e) {
                    if (!t.data) return e();
                    if (t.xhr && t.xhrType === i.XHR_RESPONSE_TYPE.BLOB)
                        if (window.Blob && "string" != typeof t.data) {
                            if (0 === t.data.type.indexOf("image")) {
                                var r = URL.createObjectURL(t.data);
                                t.blob = t.data, t.data = new Image, t.data.src = r, t.isImage = !0, t.data.onload = function() {
                                    URL.revokeObjectURL(r), t.data.onload = null, e()
                                }
                            }
                        } else {
                            var o = t.xhr.getResponseHeader("content-type");
                            o && 0 === o.indexOf("image") && (t.data = new Image, t.data.src = "data:" + o + ";base64," + n.encodeBinary(t.xhr.responseText), t.isImage = !0, t.data.onload = function() {
                                t.data.onload = null, e()
                            })
                        } else e()
                }
            }
        }, {
            "../../Resource": 14,
            "../../b64": 15
        }],
        19: [function(t, e, r) {
            e.exports = {
                name: "pixi.js",
                version: "3.0.8",
                description: "Pixi.js is a fast lightweight 2D library that works across all devices.",
                author: "Mat Groves",
                contributors: ["Chad Engler <chad@pantherdev.com>", "Richard Davey <rdavey@gmail.com>"],
                main: "./src/index.js",
                homepage: "http://goodboydigital.com/",
                bugs: "https://github.com/pixijs/pixi.js/issues",
                license: "MIT",
                repository: {
                    type: "git",
                    url: "https://github.com/pixijs/pixi.js.git"
                },
                scripts: {
                    start: "gulp && gulp watch",
                    test: "gulp && testem ci",
                    build: "gulp",
                    docs: "jsdoc -c ./gulp/util/jsdoc.conf.json -R README.md"
                },
                files: ["bin/", "src/", "CONTRIBUTING.md", "LICENSE", "package.json", "README.md"],
                dependencies: {
                    async: "^1.4.2",
                    brfs: "^1.4.1",
                    earcut: "^2.0.2",
                    eventemitter3: "^1.1.1",
                    "gulp-header": "^1.7.1",
                    "object-assign": "^4.0.1",
                    "resource-loader": "^1.6.2"
                },
                devDependencies: {
                    browserify: "^11.1.0",
                    chai: "^3.2.0",
                    del: "^2.0.2",
                    gulp: "^3.9.0",
                    "gulp-cached": "^1.1.0",
                    "gulp-concat": "^2.6.0",
                    "gulp-debug": "^2.1.0",
                    "gulp-jshint": "^1.11.2",
                    "gulp-mirror": "^0.4.0",
                    "gulp-plumber": "^1.0.1",
                    "gulp-rename": "^1.2.2",
                    "gulp-sourcemaps": "^1.5.2",
                    "gulp-uglify": "^1.4.1",
                    "gulp-util": "^3.0.6",
                    "jaguarjs-jsdoc": "git+https://github.com/davidshimjs/jaguarjs-jsdoc.git",
                    jsdoc: "^3.3.2",
                    "jshint-summary": "^0.4.0",
                    minimist: "^1.2.0",
                    mocha: "^2.3.2",
                    "require-dir": "^0.3.0",
                    "run-sequence": "^1.1.2",
                    testem: "^0.9.4",
                    "vinyl-buffer": "^1.0.0",
                    "vinyl-source-stream": "^1.1.0",
                    watchify: "^3.4.0"
                },
                browserify: {
                    transform: ["brfs"]
                }
            }
        }, {}],
        20: [function(t, e, r) {
            var i = {
                VERSION: t("../../package.json").version,
                PI_2: 2 * Math.PI,
                RAD_TO_DEG: 180 / Math.PI,
                DEG_TO_RAD: Math.PI / 180,
                TARGET_FPMS: .06,
                RENDERER_TYPE: {
                    UNKNOWN: 0,
                    WEBGL: 1,
                    CANVAS: 2
                },
                BLEND_MODES: {
                    NORMAL: 0,
                    ADD: 1,
                    MULTIPLY: 2,
                    SCREEN: 3,
                    OVERLAY: 4,
                    DARKEN: 5,
                    LIGHTEN: 6,
                    COLOR_DODGE: 7,
                    COLOR_BURN: 8,
                    HARD_LIGHT: 9,
                    SOFT_LIGHT: 10,
                    DIFFERENCE: 11,
                    EXCLUSION: 12,
                    HUE: 13,
                    SATURATION: 14,
                    COLOR: 15,
                    LUMINOSITY: 16
                },
                DRAW_MODES: {
                    POINTS: 0,
                    LINES: 1,
                    LINE_LOOP: 2,
                    LINE_STRIP: 3,
                    TRIANGLES: 4,
                    TRIANGLE_STRIP: 5,
                    TRIANGLE_FAN: 6
                },
                SCALE_MODES: {
                    DEFAULT: 0,
                    LINEAR: 0,
                    NEAREST: 1
                },
                RETINA_PREFIX: /@(.+)x/,
                RESOLUTION: 1,
                FILTER_RESOLUTION: 1,
                DEFAULT_RENDER_OPTIONS: {
                    view: null,
                    resolution: 1,
                    antialias: !1,
                    forceFXAA: !1,
                    autoResize: !1,
                    transparent: !1,
                    backgroundColor: 0,
                    clearBeforeRender: !0,
                    preserveDrawingBuffer: !1,
                    roundPixels: !1
                },
                SHAPES: {
                    POLY: 0,
                    RECT: 1,
                    CIRC: 2,
                    ELIP: 3,
                    RREC: 4
                },
                SPRITE_BATCH_SIZE: 2e3
            };
            e.exports = i
        }, {
            "../../package.json": 19
        }],
        21: [function(t, e, r) {
            function i() {
                o.call(this), this.children = []
            }
            var n = t("../math"),
                o = t("./DisplayObject"),
                s = t("../textures/RenderTexture"),
                a = new n.Matrix;
            i.prototype = Object.create(o.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                width: {
                    get: function() {
                        return this.scale.x * this.getLocalBounds().width
                    },
                    set: function(t) {
                        var e = this.getLocalBounds().width;
                        0 !== e ? this.scale.x = t / e : this.scale.x = 1, this._width = t
                    }
                },
                height: {
                    get: function() {
                        return this.scale.y * this.getLocalBounds().height
                    },
                    set: function(t) {
                        var e = this.getLocalBounds().height;
                        0 !== e ? this.scale.y = t / e : this.scale.y = 1, this._height = t
                    }
                }
            }), i.prototype.onChildrenChange = function() {}, i.prototype.addChild = function(t) {
                return this.addChildAt(t, this.children.length)
            }, i.prototype.addChildAt = function(t, e) {
                if (t === this) return t;
                if (e >= 0 && e <= this.children.length) return t.parent && t.parent.removeChild(t), t.parent = this, this.children.splice(e, 0, t), this.onChildrenChange(e), t.emit("added", this), t;
                throw new Error(t + "addChildAt: The index " + e + " supplied is out of bounds " + this.children.length)
            }, i.prototype.swapChildren = function(t, e) {
                if (t !== e) {
                    var r = this.getChildIndex(t),
                        i = this.getChildIndex(e);
                    if (0 > r || 0 > i) throw new Error("swapChildren: Both the supplied DisplayObjects must be children of the caller.");
                    this.children[r] = e, this.children[i] = t, this.onChildrenChange(i > r ? r : i)
                }
            }, i.prototype.getChildIndex = function(t) {
                var e = this.children.indexOf(t);
                if (-1 === e) throw new Error("The supplied DisplayObject must be a child of the caller");
                return e
            }, i.prototype.setChildIndex = function(t, e) {
                if (0 > e || e >= this.children.length) throw new Error("The supplied index is out of bounds");
                var r = this.getChildIndex(t);
                this.children.splice(r, 1), this.children.splice(e, 0, t), this.onChildrenChange(e)
            }, i.prototype.getChildAt = function(t) {
                if (0 > t || t >= this.children.length) throw new Error("getChildAt: Supplied index " + t + " does not exist in the child list, or the supplied DisplayObject is not a child of the caller");
                return this.children[t]
            }, i.prototype.removeChild = function(t) {
                var e = this.children.indexOf(t);
                if (-1 !== e) return this.removeChildAt(e)
            }, i.prototype.removeChildAt = function(t) {
                var e = this.getChildAt(t);
                return e.parent = null, this.children.splice(t, 1), this.onChildrenChange(t), e.emit("removed", this), e
            }, i.prototype.removeChildren = function(t, e) {
                var r, i, n = t || 0,
                    o = "number" == typeof e ? e : this.children.length,
                    s = o - n;
                if (s > 0 && o >= s) {
                    for (r = this.children.splice(n, s), i = 0; i < r.length; ++i) r[i].parent = null;
                    for (this.onChildrenChange(t), i = 0; i < r.length; ++i) r[i].emit("removed", this);
                    return r
                }
                if (0 === s && 0 === this.children.length) return [];
                throw new RangeError("removeChildren: numeric values are outside the acceptable range.")
            }, i.prototype.generateTexture = function(t, e, r) {
                var i = this.getLocalBounds(),
                    n = new s(t, 0 | i.width, 0 | i.height, r, e);
                return a.tx = -i.x, a.ty = -i.y, n.render(this, a), n
            }, i.prototype.updateTransform = function() {
                if (this.visible) {
                    this.displayObjectUpdateTransform();
                    for (var t = 0, e = this.children.length; e > t; ++t) this.children[t].updateTransform()
                }
            }, i.prototype.containerUpdateTransform = i.prototype.updateTransform, i.prototype.getBounds = function() {
                if (!this._currentBounds) {
                    if (0 === this.children.length) return n.Rectangle.EMPTY;
                    for (var t, e, r, i = 1 / 0, o = 1 / 0, s = -(1 / 0), a = -(1 / 0), h = !1, u = 0, l = this.children.length; l > u; ++u) {
                        var c = this.children[u];
                        c.visible && (h = !0, t = this.children[u].getBounds(), i = i < t.x ? i : t.x, o = o < t.y ? o : t.y, e = t.width + t.x, r = t.height + t.y, s = s > e ? s : e, a = a > r ? a : r)
                    }
                    if (!h) return n.Rectangle.EMPTY;
                    var p = this._bounds;
                    p.x = i, p.y = o, p.width = s - i, p.height = a - o, this._currentBounds = p
                }
                return this._currentBounds
            }, i.prototype.containerGetBounds = i.prototype.getBounds, i.prototype.getLocalBounds = function() {
                var t = this.worldTransform;
                this.worldTransform = n.Matrix.IDENTITY;
                for (var e = 0, r = this.children.length; r > e; ++e) this.children[e].updateTransform();
                return this.worldTransform = t, this._currentBounds = null, this.getBounds(n.Matrix.IDENTITY)
            }, i.prototype.renderWebGL = function(t) {
                if (this.visible && !(this.worldAlpha <= 0) && this.renderable) {
                    var e, r;
                    if (this._mask || this._filters) {
                        for (t.currentRenderer.flush(), this._filters && this._filters.length && t.filterManager.pushFilter(this, this._filters), this._mask && t.maskManager.pushMask(this, this._mask), t.currentRenderer.start(), this._renderWebGL(t), e = 0, r = this.children.length; r > e; e++) this.children[e].renderWebGL(t);
                        t.currentRenderer.flush(), this._mask && t.maskManager.popMask(this, this._mask), this._filters && t.filterManager.popFilter(), t.currentRenderer.start()
                    } else
                        for (this._renderWebGL(t), e = 0, r = this.children.length; r > e; ++e) this.children[e].renderWebGL(t)
                }
            }, i.prototype._renderWebGL = function(t) {}, i.prototype._renderCanvas = function(t) {}, i.prototype.renderCanvas = function(t) {
                if (this.visible && !(this.alpha <= 0) && this.renderable) {
                    this._mask && t.maskManager.pushMask(this._mask, t), this._renderCanvas(t);
                    for (var e = 0, r = this.children.length; r > e; ++e) this.children[e].renderCanvas(t);
                    this._mask && t.maskManager.popMask(t)
                }
            }, i.prototype.destroy = function(t) {
                if (o.prototype.destroy.call(this), t)
                    for (var e = 0, r = this.children.length; r > e; ++e) this.children[e].destroy(t);
                this.removeChildren(), this.children = null
            }
        }, {
            "../math": 30,
            "../textures/RenderTexture": 68,
            "./DisplayObject": 22
        }],
        22: [function(t, e, r) {
            function i() {
                s.call(this), this.position = new n.Point, this.scale = new n.Point(1, 1), this.pivot = new n.Point(0, 0), this.rotation = 0, this.alpha = 1, this.visible = !0, this.renderable = !0, this.parent = null, this.worldAlpha = 1, this.worldTransform = new n.Matrix, this.filterArea = null, this._sr = 0, this._cr = 1, this._bounds = new n.Rectangle(0, 0, 1, 1), this._currentBounds = null, this._mask = null
            }
            var n = t("../math"),
                o = t("../textures/RenderTexture"),
                s = t("eventemitter3"),
                a = t("../const"),
                h = new n.Matrix,
                u = {
                    worldTransform: new n.Matrix,
                    worldAlpha: 1,
                    children: []
                };
            i.prototype = Object.create(s.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                x: {
                    get: function() {
                        return this.position.x
                    },
                    set: function(t) {
                        this.position.x = t
                    }
                },
                y: {
                    get: function() {
                        return this.position.y
                    },
                    set: function(t) {
                        this.position.y = t
                    }
                },
                worldVisible: {
                    get: function() {
                        var t = this;
                        do {
                            if (!t.visible) return !1;
                            t = t.parent
                        } while (t);
                        return !0
                    }
                },
                mask: {
                    get: function() {
                        return this._mask
                    },
                    set: function(t) {
                        this._mask && (this._mask.renderable = !0), this._mask = t, this._mask && (this._mask.renderable = !1)
                    }
                },
                filters: {
                    get: function() {
                        return this._filters && this._filters.slice()
                    },
                    set: function(t) {
                        this._filters = t && t.slice()
                    }
                }
            }), i.prototype.updateTransform = function() {
                var t, e, r, i, n, o, s = this.parent.worldTransform,
                    h = this.worldTransform;
                this.rotation % a.PI_2 ? (this.rotation !== this.rotationCache && (this.rotationCache = this.rotation, this._sr = Math.sin(this.rotation), this._cr = Math.cos(this.rotation)), t = this._cr * this.scale.x, e = this._sr * this.scale.x, r = -this._sr * this.scale.y, i = this._cr * this.scale.y, n = this.position.x, o = this.position.y, (this.pivot.x || this.pivot.y) && (n -= this.pivot.x * t + this.pivot.y * r, o -= this.pivot.x * e + this.pivot.y * i), h.a = t * s.a + e * s.c, h.b = t * s.b + e * s.d, h.c = r * s.a + i * s.c, h.d = r * s.b + i * s.d, h.tx = n * s.a + o * s.c + s.tx, h.ty = n * s.b + o * s.d + s.ty) : (t = this.scale.x, i = this.scale.y, n = this.position.x - this.pivot.x * t, o = this.position.y - this.pivot.y * i, h.a = t * s.a, h.b = t * s.b, h.c = i * s.c, h.d = i * s.d, h.tx = n * s.a + o * s.c + s.tx, h.ty = n * s.b + o * s.d + s.ty), this.worldAlpha = this.alpha * this.parent.worldAlpha, this._currentBounds = null
            }, i.prototype.displayObjectUpdateTransform = i.prototype.updateTransform, i.prototype.getBounds = function(t) {
                return n.Rectangle.EMPTY
            }, i.prototype.getLocalBounds = function() {
                return this.getBounds(n.Matrix.IDENTITY)
            }, i.prototype.toGlobal = function(t) {
                return this.parent ? this.displayObjectUpdateTransform() : (this.parent = u, this.displayObjectUpdateTransform(), this.parent = null), this.worldTransform.apply(t)
            }, i.prototype.toLocal = function(t, e) {
                return e && (t = e.toGlobal(t)), this.parent ? this.displayObjectUpdateTransform() : (this.parent = u, this.displayObjectUpdateTransform(), this.parent = null), this.worldTransform.applyInverse(t)
            }, i.prototype.renderWebGL = function(t) {}, i.prototype.renderCanvas = function(t) {}, i.prototype.generateTexture = function(t, e, r) {
                var i = this.getLocalBounds(),
                    n = new o(t, 0 | i.width, 0 | i.height, e, r);
                return h.tx = -i.x, h.ty = -i.y, n.render(this, h), n
            }, i.prototype.setParent = function(t) {
                if (!t || !t.addChild) throw new Error("setParent: Argument must be a Container");
                return t.addChild(this), t
            }, i.prototype.destroy = function() {
                this.position = null, this.scale = null, this.pivot = null, this.parent = null, this._bounds = null, this._currentBounds = null, this._mask = null, this.worldTransform = null, this.filterArea = null
            }
        }, {
            "../const": 20,
            "../math": 30,
            "../textures/RenderTexture": 68,
            eventemitter3: 10
        }],
        23: [function(t, e, r) {
            function i() {
                n.call(this), this.fillAlpha = 1, this.lineWidth = 0, this.lineColor = 0, this.graphicsData = [], this.tint = 16777215, this._prevTint = 16777215, this.blendMode = l.BLEND_MODES.NORMAL, this.currentPath = null, this._webGL = {}, this.isMask = !1, this.boundsPadding = 0, this._localBounds = new u.Rectangle(0, 0, 1, 1), this.dirty = !0, this.glDirty = !1, this.boundsDirty = !0, this.cachedSpriteDirty = !1
            }
            var n = t("../display/Container"),
                o = t("../textures/Texture"),
                s = t("../renderers/canvas/utils/CanvasBuffer"),
                a = t("../renderers/canvas/utils/CanvasGraphics"),
                h = t("./GraphicsData"),
                u = t("../math"),
                l = t("../const"),
                c = new u.Point;
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                var t = new i;
                t.renderable = this.renderable, t.fillAlpha = this.fillAlpha, t.lineWidth = this.lineWidth, t.lineColor = this.lineColor, t.tint = this.tint, t.blendMode = this.blendMode, t.isMask = this.isMask, t.boundsPadding = this.boundsPadding, t.dirty = !0, t.glDirty = !0, t.cachedSpriteDirty = this.cachedSpriteDirty;
                for (var e = 0; e < this.graphicsData.length; ++e) t.graphicsData.push(this.graphicsData[e].clone());
                return t.currentPath = t.graphicsData[t.graphicsData.length - 1], t.updateLocalBounds(), t
            }, i.prototype.lineStyle = function(t, e, r) {
                if (this.lineWidth = t || 0, this.lineColor = e || 0, this.lineAlpha = void 0 === r ? 1 : r, this.currentPath)
                    if (this.currentPath.shape.points.length) {
                        var i = new u.Polygon(this.currentPath.shape.points.slice(-2));
                        i.closed = !1, this.drawShape(i)
                    } else this.currentPath.lineWidth = this.lineWidth, this.currentPath.lineColor = this.lineColor, this.currentPath.lineAlpha = this.lineAlpha;
                return this
            }, i.prototype.moveTo = function(t, e) {
                var r = new u.Polygon([t, e]);
                return r.closed = !1, this.drawShape(r), this
            }, i.prototype.lineTo = function(t, e) {
                return this.currentPath.shape.points.push(t, e), this.dirty = !0, this
            }, i.prototype.quadraticCurveTo = function(t, e, r, i) {
                this.currentPath ? 0 === this.currentPath.shape.points.length && (this.currentPath.shape.points = [0, 0]) : this.moveTo(0, 0);
                var n, o, s = 20,
                    a = this.currentPath.shape.points;
                0 === a.length && this.moveTo(0, 0);
                for (var h = a[a.length - 2], u = a[a.length - 1], l = 0, c = 1; s >= c; ++c) l = c / s, n = h + (t - h) * l, o = u + (e - u) * l, a.push(n + (t + (r - t) * l - n) * l, o + (e + (i - e) * l - o) * l);
                return this.dirty = this.boundsDirty = !0, this
            }, i.prototype.bezierCurveTo = function(t, e, r, i, n, o) {
                this.currentPath ? 0 === this.currentPath.shape.points.length && (this.currentPath.shape.points = [0, 0]) : this.moveTo(0, 0);
                for (var s, a, h, u, l, c = 20, p = this.currentPath.shape.points, d = p[p.length - 2], f = p[p.length - 1], v = 0, g = 1; c >= g; ++g) v = g / c, s = 1 - v, a = s * s, h = a * s, u = v * v, l = u * v, p.push(h * d + 3 * a * v * t + 3 * s * u * r + l * n, h * f + 3 * a * v * e + 3 * s * u * i + l * o);
                return this.dirty = this.boundsDirty = !0, this
            }, i.prototype.arcTo = function(t, e, r, i, n) {
                this.currentPath ? 0 === this.currentPath.shape.points.length && this.currentPath.shape.points.push(t, e) : this.moveTo(t, e);
                var o = this.currentPath.shape.points,
                    s = o[o.length - 2],
                    a = o[o.length - 1],
                    h = a - e,
                    u = s - t,
                    l = i - e,
                    c = r - t,
                    p = Math.abs(h * c - u * l);
                if (1e-8 > p || 0 === n)(o[o.length - 2] !== t || o[o.length - 1] !== e) && o.push(t, e);
                else {
                    var d = h * h + u * u,
                        f = l * l + c * c,
                        v = h * l + u * c,
                        g = n * Math.sqrt(d) / p,
                        m = n * Math.sqrt(f) / p,
                        y = g * v / d,
                        x = m * v / f,
                        b = g * c + m * u,
                        _ = g * l + m * h,
                        T = u * (m + y),
                        E = h * (m + y),
                        S = c * (g + x),
                        w = l * (g + x),
                        A = Math.atan2(E - _, T - b),
                        C = Math.atan2(w - _, S - b);
                    this.arc(b + t, _ + e, n, A, C, u * l > c * h)
                }
                return this.dirty = this.boundsDirty = !0, this
            }, i.prototype.arc = function(t, e, r, i, n, o) {
                if (o = o || !1, i === n) return this;
                !o && i >= n ? n += 2 * Math.PI : o && n >= i && (i += 2 * Math.PI);
                var s = o ? -1 * (i - n) : n - i,
                    a = 40 * Math.ceil(Math.abs(s) / (2 * Math.PI));
                if (0 === s) return this;
                var h = t + Math.cos(i) * r,
                    u = e + Math.sin(i) * r;
                this.currentPath ? this.currentPath.shape.points.push(h, u) : this.moveTo(h, u);
                for (var l = this.currentPath.shape.points, c = s / (2 * a), p = 2 * c, d = Math.cos(c), f = Math.sin(c), v = a - 1, g = v % 1 / v, m = 0; v >= m; m++) {
                    var y = m + g * m,
                        x = c + i + p * y,
                        b = Math.cos(x),
                        _ = -Math.sin(x);
                    l.push((d * b + f * _) * r + t, (d * -_ + f * b) * r + e)
                }
                return this.dirty = this.boundsDirty = !0, this
            }, i.prototype.beginFill = function(t, e) {
                return this.filling = !0, this.fillColor = t || 0, this.fillAlpha = void 0 === e ? 1 : e, this.currentPath && this.currentPath.shape.points.length <= 2 && (this.currentPath.fill = this.filling, this.currentPath.fillColor = this.fillColor, this.currentPath.fillAlpha = this.fillAlpha), this
            }, i.prototype.endFill = function() {
                return this.filling = !1, this.fillColor = null, this.fillAlpha = 1, this
            }, i.prototype.drawRect = function(t, e, r, i) {
                return this.drawShape(new u.Rectangle(t, e, r, i)), this
            }, i.prototype.drawRoundedRect = function(t, e, r, i, n) {
                return this.drawShape(new u.RoundedRectangle(t, e, r, i, n)), this
            }, i.prototype.drawCircle = function(t, e, r) {
                return this.drawShape(new u.Circle(t, e, r)), this
            }, i.prototype.drawEllipse = function(t, e, r, i) {
                return this.drawShape(new u.Ellipse(t, e, r, i)), this
            }, i.prototype.drawPolygon = function(t) {
                var e = t,
                    r = !0;
                if (e instanceof u.Polygon && (r = e.closed, e = e.points), !Array.isArray(e)) {
                    e = new Array(arguments.length);
                    for (var i = 0; i < e.length; ++i) e[i] = arguments[i]
                }
                var n = new u.Polygon(e);
                return n.closed = r, this.drawShape(n), this
            }, i.prototype.clear = function() {
                return this.lineWidth = 0, this.filling = !1, this.dirty = !0, this.clearDirty = !0, this.graphicsData = [], this
            }, i.prototype.generateTexture = function(t, e, r) {
                e = e || 1;
                var i = this.getLocalBounds(),
                    n = new s(i.width * e, i.height * e),
                    h = o.fromCanvas(n.canvas, r);
                return h.baseTexture.resolution = e, n.context.scale(e, e), n.context.translate(-i.x, -i.y), a.renderGraphics(this, n.context), h
            }, i.prototype._renderWebGL = function(t) {
                this.glDirty && (this.dirty = !0, this.glDirty = !1), t.setObjectRenderer(t.plugins.graphics), t.plugins.graphics.render(this)
            }, i.prototype._renderCanvas = function(t) {
                if (this.isMask !== !0) {
                    this._prevTint !== this.tint && (this.dirty = !0);
                    var e = t.context,
                        r = this.worldTransform,
                        i = t.blendModes[this.blendMode];
                    i !== e.globalCompositeOperation && (e.globalCompositeOperation = i);
                    var n = t.resolution;
                    e.setTransform(r.a * n, r.b * n, r.c * n, r.d * n, r.tx * n, r.ty * n), a.renderGraphics(this, e)
                }
            }, i.prototype.getBounds = function(t) {
                if (!this._currentBounds) {
                    if (!this.renderable) return u.Rectangle.EMPTY;
                    this.boundsDirty && (this.updateLocalBounds(), this.glDirty = !0, this.cachedSpriteDirty = !0, this.boundsDirty = !1);
                    var e = this._localBounds,
                        r = e.x,
                        i = e.width + e.x,
                        n = e.y,
                        o = e.height + e.y,
                        s = t || this.worldTransform,
                        a = s.a,
                        h = s.b,
                        l = s.c,
                        c = s.d,
                        p = s.tx,
                        d = s.ty,
                        f = a * i + l * o + p,
                        v = c * o + h * i + d,
                        g = a * r + l * o + p,
                        m = c * o + h * r + d,
                        y = a * r + l * n + p,
                        x = c * n + h * r + d,
                        b = a * i + l * n + p,
                        _ = c * n + h * i + d,
                        T = f,
                        E = v,
                        S = f,
                        w = v;
                    S = S > g ? g : S, S = S > y ? y : S, S = S > b ? b : S, w = w > m ? m : w, w = w > x ? x : w, w = w > _ ? _ : w, T = g > T ? g : T, T = y > T ? y : T, T = b > T ? b : T, E = m > E ? m : E, E = x > E ? x : E, E = _ > E ? _ : E, this._bounds.x = S, this._bounds.width = T - S, this._bounds.y = w, this._bounds.height = E - w, this._currentBounds = this._bounds
                }
                return this._currentBounds
            }, i.prototype.containsPoint = function(t) {
                this.worldTransform.applyInverse(t, c);
                for (var e = this.graphicsData, r = 0; r < e.length; r++) {
                    var i = e[r];
                    if (i.fill && i.shape && i.shape.contains(c.x, c.y)) return !0
                }
                return !1
            }, i.prototype.updateLocalBounds = function() {
                var t = 1 / 0,
                    e = -(1 / 0),
                    r = 1 / 0,
                    i = -(1 / 0);
                if (this.graphicsData.length)
                    for (var n, o, s, a, h, u, c = 0; c < this.graphicsData.length; c++) {
                        var p = this.graphicsData[c],
                            d = p.type,
                            f = p.lineWidth;
                        if (n = p.shape, d === l.SHAPES.RECT || d === l.SHAPES.RREC) s = n.x - f / 2, a = n.y - f / 2, h = n.width + f, u = n.height + f, t = t > s ? s : t, e = s + h > e ? s + h : e, r = r > a ? a : r, i = a + u > i ? a + u : i;
                        else if (d === l.SHAPES.CIRC) s = n.x, a = n.y, h = n.radius + f / 2, u = n.radius + f / 2, t = t > s - h ? s - h : t, e = s + h > e ? s + h : e, r = r > a - u ? a - u : r, i = a + u > i ? a + u : i;
                        else if (d === l.SHAPES.ELIP) s = n.x, a = n.y, h = n.width + f / 2, u = n.height + f / 2, t = t > s - h ? s - h : t, e = s + h > e ? s + h : e, r = r > a - u ? a - u : r, i = a + u > i ? a + u : i;
                        else {
                            o = n.points;
                            for (var v = 0; v < o.length; v += 2) s = o[v], a = o[v + 1], t = t > s - f ? s - f : t, e = s + f > e ? s + f : e, r = r > a - f ? a - f : r, i = a + f > i ? a + f : i
                        }
                    } else t = 0, e = 0, r = 0, i = 0;
                var g = this.boundsPadding;
                this._localBounds.x = t - g, this._localBounds.width = e - t + 2 * g, this._localBounds.y = r - g, this._localBounds.height = i - r + 2 * g
            }, i.prototype.drawShape = function(t) {
                this.currentPath && this.currentPath.shape.points.length <= 2 && this.graphicsData.pop(), this.currentPath = null;
                var e = new h(this.lineWidth, this.lineColor, this.lineAlpha, this.fillColor, this.fillAlpha, this.filling, t);
                return this.graphicsData.push(e), e.type === l.SHAPES.POLY && (e.shape.closed = e.shape.closed || this.filling, this.currentPath = e), this.dirty = this.boundsDirty = !0, e
            }, i.prototype.destroy = function() {
                n.prototype.destroy.apply(this, arguments);
                for (var t = 0; t < this.graphicsData.length; ++t) this.graphicsData[t].destroy();
                for (var e in this._webgl)
                    for (var r = 0; r < this._webgl[e].data.length; ++r) this._webgl[e].data[r].destroy();
                this.graphicsData = null, this.currentPath = null, this._webgl = null, this._localBounds = null
            }
        }, {
            "../const": 20,
            "../display/Container": 21,
            "../math": 30,
            "../renderers/canvas/utils/CanvasBuffer": 42,
            "../renderers/canvas/utils/CanvasGraphics": 43,
            "../textures/Texture": 69,
            "./GraphicsData": 24
        }],
        24: [function(t, e, r) {
            function i(t, e, r, i, n, o, s) {
                this.lineWidth = t, this.lineColor = e, this.lineAlpha = r, this._lineTint = e, this.fillColor = i, this.fillAlpha = n, this._fillTint = i, this.fill = o, this.shape = s, this.type = s.type
            }
            i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                return new i(this.lineWidth, this.lineColor, this.lineAlpha, this.fillColor, this.fillAlpha, this.fill, this.shape)
            }, i.prototype.destroy = function() {
                this.shape = null
            }
        }, {}],
        25: [function(t, e, r) {
            function i(t) {
                a.call(this, t), this.graphicsDataPool = [], this.primitiveShader = null, this.complexPrimitiveShader = null, this.maximumSimplePolySize = 200
            }
            var n = t("../../utils"),
                o = t("../../math"),
                s = t("../../const"),
                a = t("../../renderers/webgl/utils/ObjectRenderer"),
                h = t("../../renderers/webgl/WebGLRenderer"),
                u = t("./WebGLGraphicsData"),
                l = t("earcut");
            i.prototype = Object.create(a.prototype), i.prototype.constructor = i, e.exports = i, h.registerPlugin("graphics", i), i.prototype.onContextChange = function() {}, i.prototype.destroy = function() {
                a.prototype.destroy.call(this);
                for (var t = 0; t < this.graphicsDataPool.length; ++t) this.graphicsDataPool[t].destroy();
                this.graphicsDataPool = null
            }, i.prototype.render = function(t) {
                var e, r = this.renderer,
                    i = r.gl,
                    o = r.shaderManager.plugins.primitiveShader;
                t.dirty && this.updateGraphics(t);
                var s = t._webGL[i.id];
                r.blendModeManager.setBlendMode(t.blendMode);
                for (var a = 0, h = s.data.length; h > a; a++) e = s.data[a], 1 === s.data[a].mode ? (r.stencilManager.pushStencil(t, e), i.uniform1f(r.shaderManager.complexPrimitiveShader.uniforms.alpha._location, t.worldAlpha * e.alpha), i.drawElements(i.TRIANGLE_FAN, 4, i.UNSIGNED_SHORT, 2 * (e.indices.length - 4)), r.stencilManager.popStencil(t, e)) : (o = r.shaderManager.primitiveShader, r.shaderManager.setShader(o), i.uniformMatrix3fv(o.uniforms.translationMatrix._location, !1, t.worldTransform.toArray(!0)), i.uniformMatrix3fv(o.uniforms.projectionMatrix._location, !1, r.currentRenderTarget.projectionMatrix.toArray(!0)), i.uniform3fv(o.uniforms.tint._location, n.hex2rgb(t.tint)), i.uniform1f(o.uniforms.alpha._location, t.worldAlpha), i.bindBuffer(i.ARRAY_BUFFER, e.buffer), i.vertexAttribPointer(o.attributes.aVertexPosition, 2, i.FLOAT, !1, 24, 0), i.vertexAttribPointer(o.attributes.aColor, 4, i.FLOAT, !1, 24, 8), i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, e.indexBuffer), i.drawElements(i.TRIANGLE_STRIP, e.indices.length, i.UNSIGNED_SHORT, 0)), r.drawCount++
            }, i.prototype.updateGraphics = function(t) {
                var e = this.renderer.gl,
                    r = t._webGL[e.id];
                r || (r = t._webGL[e.id] = {
                    lastIndex: 0,
                    data: [],
                    gl: e
                }), t.dirty = !1;
                var i;
                if (t.clearDirty) {
                    for (t.clearDirty = !1, i = 0; i < r.data.length; i++) {
                        var n = r.data[i];
                        n.reset(), this.graphicsDataPool.push(n)
                    }
                    r.data = [], r.lastIndex = 0
                }
                var o;
                for (i = r.lastIndex; i < t.graphicsData.length; i++) {
                    var a = t.graphicsData[i];
                    if (a.type === s.SHAPES.POLY) {
                        if (a.points = a.shape.points.slice(), a.shape.closed && (a.points[0] !== a.points[a.points.length - 2] || a.points[1] !== a.points[a.points.length - 1]) && a.points.push(a.points[0], a.points[1]), a.fill && a.points.length >= 6)
                            if (a.points.length < 2 * this.maximumSimplePolySize) {
                                o = this.switchMode(r, 0);
                                var h = this.buildPoly(a, o);
                                h || (o = this.switchMode(r, 1), this.buildComplexPoly(a, o))
                            } else o = this.switchMode(r, 1), this.buildComplexPoly(a, o);
                        a.lineWidth > 0 && (o = this.switchMode(r, 0), this.buildLine(a, o))
                    } else o = this.switchMode(r, 0), a.type === s.SHAPES.RECT ? this.buildRectangle(a, o) : a.type === s.SHAPES.CIRC || a.type === s.SHAPES.ELIP ? this.buildCircle(a, o) : a.type === s.SHAPES.RREC && this.buildRoundedRectangle(a, o);
                    r.lastIndex++
                }
                for (i = 0; i < r.data.length; i++) o = r.data[i], o.dirty && o.upload()
            }, i.prototype.switchMode = function(t, e) {
                var r;
                return t.data.length ? (r = t.data[t.data.length - 1], (r.points.length > 32e4 || r.mode !== e || 1 === e) && (r = this.graphicsDataPool.pop() || new u(t.gl), r.mode = e, t.data.push(r))) : (r = this.graphicsDataPool.pop() || new u(t.gl), r.mode = e, t.data.push(r)), r.dirty = !0, r
            }, i.prototype.buildRectangle = function(t, e) {
                var r = t.shape,
                    i = r.x,
                    o = r.y,
                    s = r.width,
                    a = r.height;
                if (t.fill) {
                    var h = n.hex2rgb(t.fillColor),
                        u = t.fillAlpha,
                        l = h[0] * u,
                        c = h[1] * u,
                        p = h[2] * u,
                        d = e.points,
                        f = e.indices,
                        v = d.length / 6;
                    d.push(i, o), d.push(l, c, p, u), d.push(i + s, o), d.push(l, c, p, u), d.push(i, o + a), d.push(l, c, p, u), d.push(i + s, o + a), d.push(l, c, p, u), f.push(v, v, v + 1, v + 2, v + 3, v + 3)
                }
                if (t.lineWidth) {
                    var g = t.points;
                    t.points = [i, o, i + s, o, i + s, o + a, i, o + a, i, o], this.buildLine(t, e), t.points = g
                }
            }, i.prototype.buildRoundedRectangle = function(t, e) {
                var r = t.shape,
                    i = r.x,
                    o = r.y,
                    s = r.width,
                    a = r.height,
                    h = r.radius,
                    u = [];
                if (u.push(i, o + h), this.quadraticBezierCurve(i, o + a - h, i, o + a, i + h, o + a, u), this.quadraticBezierCurve(i + s - h, o + a, i + s, o + a, i + s, o + a - h, u), this.quadraticBezierCurve(i + s, o + h, i + s, o, i + s - h, o, u), this.quadraticBezierCurve(i + h, o, i, o, i, o + h + 1e-10, u), t.fill) {
                    var c = n.hex2rgb(t.fillColor),
                        p = t.fillAlpha,
                        d = c[0] * p,
                        f = c[1] * p,
                        v = c[2] * p,
                        g = e.points,
                        m = e.indices,
                        y = g.length / 6,
                        x = l(u, null, 2),
                        b = 0;
                    for (b = 0; b < x.length; b += 3) m.push(x[b] + y), m.push(x[b] + y), m.push(x[b + 1] + y), m.push(x[b + 2] + y), m.push(x[b + 2] + y);
                    for (b = 0; b < u.length; b++) g.push(u[b], u[++b], d, f, v, p)
                }
                if (t.lineWidth) {
                    var _ = t.points;
                    t.points = u, this.buildLine(t, e), t.points = _
                }
            }, i.prototype.quadraticBezierCurve = function(t, e, r, i, n, o, s) {
                function a(t, e, r) {
                    var i = e - t;
                    return t + i * r
                }
                for (var h, u, l, c, p, d, f = 20, v = s || [], g = 0, m = 0; f >= m; m++) g = m / f, h = a(t, r, g), u = a(e, i, g), l = a(r, n, g), c = a(i, o, g), p = a(h, l, g), d = a(u, c, g), v.push(p, d);
                return v
            }, i.prototype.buildCircle = function(t, e) {
                var r, i, o = t.shape,
                    a = o.x,
                    h = o.y;
                t.type === s.SHAPES.CIRC ? (r = o.radius, i = o.radius) : (r = o.width, i = o.height);
                var u = Math.floor(30 * Math.sqrt(o.radius)) || Math.floor(15 * Math.sqrt(o.width + o.height)),
                    l = 2 * Math.PI / u,
                    c = 0;
                if (t.fill) {
                    var p = n.hex2rgb(t.fillColor),
                        d = t.fillAlpha,
                        f = p[0] * d,
                        v = p[1] * d,
                        g = p[2] * d,
                        m = e.points,
                        y = e.indices,
                        x = m.length / 6;
                    for (y.push(x), c = 0; u + 1 > c; c++) m.push(a, h, f, v, g, d), m.push(a + Math.sin(l * c) * r, h + Math.cos(l * c) * i, f, v, g, d), y.push(x++, x++);
                    y.push(x - 1)
                }
                if (t.lineWidth) {
                    var b = t.points;
                    for (t.points = [], c = 0; u + 1 > c; c++) t.points.push(a + Math.sin(l * c) * r, h + Math.cos(l * c) * i);
                    this.buildLine(t, e), t.points = b
                }
            }, i.prototype.buildLine = function(t, e) {
                var r = 0,
                    i = t.points;
                if (0 !== i.length) {
                    var s = new o.Point(i[0], i[1]),
                        a = new o.Point(i[i.length - 2], i[i.length - 1]);
                    if (s.x === a.x && s.y === a.y) {
                        i = i.slice(), i.pop(), i.pop(), a = new o.Point(i[i.length - 2], i[i.length - 1]);
                        var h = a.x + .5 * (s.x - a.x),
                            u = a.y + .5 * (s.y - a.y);
                        i.unshift(h, u), i.push(h, u)
                    }
                    var l, c, p, d, f, v, g, m, y, x, b, _, T, E, S, w, A, C, R, M, O, P, F, D = e.points,
                        B = e.indices,
                        L = i.length / 2,
                        I = i.length,
                        N = D.length / 6,
                        U = t.lineWidth / 2,
                        k = n.hex2rgb(t.lineColor),
                        j = t.lineAlpha,
                        X = k[0] * j,
                        Y = k[1] * j,
                        G = k[2] * j;
                    for (p = i[0], d = i[1], f = i[2], v = i[3], y = -(d - v), x = p - f, F = Math.sqrt(y * y + x * x), y /= F, x /= F, y *= U, x *= U, D.push(p - y, d - x, X, Y, G, j), D.push(p + y, d + x, X, Y, G, j), r = 1; L - 1 > r; r++) p = i[2 * (r - 1)], d = i[2 * (r - 1) + 1], f = i[2 * r], v = i[2 * r + 1], g = i[2 * (r + 1)], m = i[2 * (r + 1) + 1], y = -(d - v), x = p - f, F = Math.sqrt(y * y + x * x), y /= F, x /= F, y *= U, x *= U, b = -(v - m), _ = f - g, F = Math.sqrt(b * b + _ * _), b /= F, _ /= F, b *= U, _ *= U, S = -x + d - (-x + v), w = -y + f - (-y + p), A = (-y + p) * (-x + v) - (-y + f) * (-x + d), C = -_ + m - (-_ + v), R = -b + f - (-b + g), M = (-b + g) * (-_ + v) - (-b + f) * (-_ + m), O = S * R - C * w, Math.abs(O) < .1 ? (O += 10.1, D.push(f - y, v - x, X, Y, G, j), D.push(f + y, v + x, X, Y, G, j)) : (l = (w * M - R * A) / O, c = (C * A - S * M) / O, P = (l - f) * (l - f) + (c - v) + (c - v), P > 19600 ? (T = y - b, E = x - _, F = Math.sqrt(T * T + E * E), T /= F, E /= F, T *= U, E *= U, D.push(f - T, v - E), D.push(X, Y, G, j), D.push(f + T, v + E), D.push(X, Y, G, j), D.push(f - T, v - E), D.push(X, Y, G, j), I++) : (D.push(l, c), D.push(X, Y, G, j), D.push(f - (l - f), v - (c - v)), D.push(X, Y, G, j)));
                    for (p = i[2 * (L - 2)], d = i[2 * (L - 2) + 1], f = i[2 * (L - 1)], v = i[2 * (L - 1) + 1], y = -(d - v), x = p - f, F = Math.sqrt(y * y + x * x), y /= F, x /= F, y *= U, x *= U, D.push(f - y, v - x), D.push(X, Y, G, j), D.push(f + y, v + x), D.push(X, Y, G, j), B.push(N), r = 0; I > r; r++) B.push(N++);
                    B.push(N - 1)
                }
            }, i.prototype.buildComplexPoly = function(t, e) {
                var r = t.points.slice();
                if (!(r.length < 6)) {
                    var i = e.indices;
                    e.points = r, e.alpha = t.fillAlpha, e.color = n.hex2rgb(t.fillColor);
                    for (var o, s, a = 1 / 0, h = -(1 / 0), u = 1 / 0, l = -(1 / 0), c = 0; c < r.length; c += 2) o = r[c], s = r[c + 1], a = a > o ? o : a, h = o > h ? o : h, u = u > s ? s : u, l = s > l ? s : l;
                    r.push(a, u, h, u, h, l, a, l);
                    var p = r.length / 2;
                    for (c = 0; p > c; c++) i.push(c)
                }
            }, i.prototype.buildPoly = function(t, e) {
                var r = t.points;
                if (!(r.length < 6)) {
                    var i = e.points,
                        o = e.indices,
                        s = r.length / 2,
                        a = n.hex2rgb(t.fillColor),
                        h = t.fillAlpha,
                        u = a[0] * h,
                        c = a[1] * h,
                        p = a[2] * h,
                        d = l(r, null, 2);
                    if (!d) return !1;
                    var f = i.length / 6,
                        v = 0;
                    for (v = 0; v < d.length; v += 3) o.push(d[v] + f), o.push(d[v] + f), o.push(d[v + 1] + f), o.push(d[v + 2] + f), o.push(d[v + 2] + f);
                    for (v = 0; s > v; v++) i.push(r[2 * v], r[2 * v + 1], u, c, p, h);
                    return !0
                }
            }
        }, {
            "../../const": 20,
            "../../math": 30,
            "../../renderers/webgl/WebGLRenderer": 46,
            "../../renderers/webgl/utils/ObjectRenderer": 60,
            "../../utils": 74,
            "./WebGLGraphicsData": 26,
            earcut: 9
        }],
        26: [function(t, e, r) {
            function i(t) {
                this.gl = t, this.color = [0, 0, 0], this.points = [], this.indices = [], this.buffer = t.createBuffer(), this.indexBuffer = t.createBuffer(), this.mode = 1, this.alpha = 1, this.dirty = !0, this.glPoints = null, this.glIndices = null
            }
            i.prototype.constructor = i, e.exports = i, i.prototype.reset = function() {
                this.points.length = 0, this.indices.length = 0
            }, i.prototype.upload = function() {
                var t = this.gl;
                this.glPoints = new Float32Array(this.points), t.bindBuffer(t.ARRAY_BUFFER, this.buffer), t.bufferData(t.ARRAY_BUFFER, this.glPoints, t.STATIC_DRAW), this.glIndices = new Uint16Array(this.indices), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indexBuffer), t.bufferData(t.ELEMENT_ARRAY_BUFFER, this.glIndices, t.STATIC_DRAW), this.dirty = !1
            }, i.prototype.destroy = function() {
                this.color = null, this.points = null, this.indices = null, this.gl.deleteBuffer(this.buffer), this.gl.deleteBuffer(this.indexBuffer), this.gl = null, this.buffer = null, this.indexBuffer = null, this.glPoints = null, this.glIndices = null
            }
        }, {}],
        27: [function(t, e, r) {
            var i = e.exports = Object.assign(t("./const"), t("./math"), {
                utils: t("./utils"),
                ticker: t("./ticker"),
                DisplayObject: t("./display/DisplayObject"),
                Container: t("./display/Container"),
                Sprite: t("./sprites/Sprite"),
                ParticleContainer: t("./particles/ParticleContainer"),
                SpriteRenderer: t("./sprites/webgl/SpriteRenderer"),
                ParticleRenderer: t("./particles/webgl/ParticleRenderer"),
                Text: t("./text/Text"),
                Graphics: t("./graphics/Graphics"),
                GraphicsData: t("./graphics/GraphicsData"),
                GraphicsRenderer: t("./graphics/webgl/GraphicsRenderer"),
                Texture: t("./textures/Texture"),
                BaseTexture: t("./textures/BaseTexture"),
                RenderTexture: t("./textures/RenderTexture"),
                VideoBaseTexture: t("./textures/VideoBaseTexture"),
                TextureUvs: t("./textures/TextureUvs"),
                CanvasRenderer: t("./renderers/canvas/CanvasRenderer"),
                CanvasGraphics: t("./renderers/canvas/utils/CanvasGraphics"),
                CanvasBuffer: t("./renderers/canvas/utils/CanvasBuffer"),
                WebGLRenderer: t("./renderers/webgl/WebGLRenderer"),
                ShaderManager: t("./renderers/webgl/managers/ShaderManager"),
                Shader: t("./renderers/webgl/shaders/Shader"),
                ObjectRenderer: t("./renderers/webgl/utils/ObjectRenderer"),
                RenderTarget: t("./renderers/webgl/utils/RenderTarget"),
                AbstractFilter: t("./renderers/webgl/filters/AbstractFilter"),
                FXAAFilter: t("./renderers/webgl/filters/FXAAFilter"),
                SpriteMaskFilter: t("./renderers/webgl/filters/SpriteMaskFilter"),
                autoDetectRenderer: function(t, e, r, n) {
                    return t = t || 800, e = e || 600, !n && i.utils.isWebGLSupported() ? new i.WebGLRenderer(t, e, r) : new i.CanvasRenderer(t, e, r)
                }
            })
        }, {
            "./const": 20,
            "./display/Container": 21,
            "./display/DisplayObject": 22,
            "./graphics/Graphics": 23,
            "./graphics/GraphicsData": 24,
            "./graphics/webgl/GraphicsRenderer": 25,
            "./math": 30,
            "./particles/ParticleContainer": 36,
            "./particles/webgl/ParticleRenderer": 38,
            "./renderers/canvas/CanvasRenderer": 41,
            "./renderers/canvas/utils/CanvasBuffer": 42,
            "./renderers/canvas/utils/CanvasGraphics": 43,
            "./renderers/webgl/WebGLRenderer": 46,
            "./renderers/webgl/filters/AbstractFilter": 47,
            "./renderers/webgl/filters/FXAAFilter": 48,
            "./renderers/webgl/filters/SpriteMaskFilter": 49,
            "./renderers/webgl/managers/ShaderManager": 53,
            "./renderers/webgl/shaders/Shader": 58,
            "./renderers/webgl/utils/ObjectRenderer": 60,
            "./renderers/webgl/utils/RenderTarget": 62,
            "./sprites/Sprite": 64,
            "./sprites/webgl/SpriteRenderer": 65,
            "./text/Text": 66,
            "./textures/BaseTexture": 67,
            "./textures/RenderTexture": 68,
            "./textures/Texture": 69,
            "./textures/TextureUvs": 70,
            "./textures/VideoBaseTexture": 71,
            "./ticker": 73,
            "./utils": 74
        }],
        28: [function(t, e, r) {
            function i() {
                this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.tx = 0, this.ty = 0
            }
            var n = t("./Point");
            i.prototype.constructor = i, e.exports = i, i.prototype.fromArray = function(t) {
                this.a = t[0], this.b = t[1], this.c = t[3], this.d = t[4], this.tx = t[2], this.ty = t[5]
            }, i.prototype.toArray = function(t, e) {
                this.array || (this.array = new Float32Array(9));
                var r = e || this.array;
                return t ? (r[0] = this.a, r[1] = this.b, r[2] = 0, r[3] = this.c, r[4] = this.d, r[5] = 0, r[6] = this.tx, r[7] = this.ty, r[8] = 1) : (r[0] = this.a, r[1] = this.c, r[2] = this.tx, r[3] = this.b, r[4] = this.d, r[5] = this.ty, r[6] = 0, r[7] = 0, r[8] = 1), r
            }, i.prototype.apply = function(t, e) {
                e = e || new n;
                var r = t.x,
                    i = t.y;
                return e.x = this.a * r + this.c * i + this.tx, e.y = this.b * r + this.d * i + this.ty, e
            }, i.prototype.applyInverse = function(t, e) {
                e = e || new n;
                var r = 1 / (this.a * this.d + this.c * -this.b),
                    i = t.x,
                    o = t.y;
                return e.x = this.d * r * i + -this.c * r * o + (this.ty * this.c - this.tx * this.d) * r, e.y = this.a * r * o + -this.b * r * i + (-this.ty * this.a + this.tx * this.b) * r, e
            }, i.prototype.translate = function(t, e) {
                return this.tx += t, this.ty += e, this
            }, i.prototype.scale = function(t, e) {
                return this.a *= t, this.d *= e, this.c *= t, this.b *= e, this.tx *= t, this.ty *= e, this
            }, i.prototype.rotate = function(t) {
                var e = Math.cos(t),
                    r = Math.sin(t),
                    i = this.a,
                    n = this.c,
                    o = this.tx;
                return this.a = i * e - this.b * r, this.b = i * r + this.b * e, this.c = n * e - this.d * r, this.d = n * r + this.d * e, this.tx = o * e - this.ty * r, this.ty = o * r + this.ty * e, this
            }, i.prototype.append = function(t) {
                var e = this.a,
                    r = this.b,
                    i = this.c,
                    n = this.d;
                return this.a = t.a * e + t.b * i, this.b = t.a * r + t.b * n, this.c = t.c * e + t.d * i, this.d = t.c * r + t.d * n, this.tx = t.tx * e + t.ty * i + this.tx, this.ty = t.tx * r + t.ty * n + this.ty, this
            }, i.prototype.prepend = function(t) {
                var e = this.tx;
                if (1 !== t.a || 0 !== t.b || 0 !== t.c || 1 !== t.d) {
                    var r = this.a,
                        i = this.c;
                    this.a = r * t.a + this.b * t.c, this.b = r * t.b + this.b * t.d, this.c = i * t.a + this.d * t.c, this.d = i * t.b + this.d * t.d
                }
                return this.tx = e * t.a + this.ty * t.c + t.tx, this.ty = e * t.b + this.ty * t.d + t.ty, this
            }, i.prototype.invert = function() {
                var t = this.a,
                    e = this.b,
                    r = this.c,
                    i = this.d,
                    n = this.tx,
                    o = t * i - e * r;
                return this.a = i / o, this.b = -e / o, this.c = -r / o, this.d = t / o, this.tx = (r * this.ty - i * n) / o, this.ty = -(t * this.ty - e * n) / o, this
            }, i.prototype.identity = function() {
                return this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.tx = 0, this.ty = 0, this
            }, i.prototype.clone = function() {
                var t = new i;
                return t.a = this.a, t.b = this.b, t.c = this.c, t.d = this.d, t.tx = this.tx, t.ty = this.ty, t
            }, i.prototype.copy = function(t) {
                return t.a = this.a, t.b = this.b, t.c = this.c, t.d = this.d, t.tx = this.tx, t.ty = this.ty, t
            }, i.IDENTITY = new i, i.TEMP_MATRIX = new i
        }, {
            "./Point": 29
        }],
        29: [function(t, e, r) {
            function i(t, e) {
                this.x = t || 0, this.y = e || 0
            }
            i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                return new i(this.x, this.y)
            }, i.prototype.copy = function(t) {
                this.set(t.x, t.y)
            }, i.prototype.equals = function(t) {
                return t.x === this.x && t.y === this.y
            }, i.prototype.set = function(t, e) {
                this.x = t || 0, this.y = e || (0 !== e ? this.x : 0)
            }
        }, {}],
        30: [function(t, e, r) {
            e.exports = {
                Point: t("./Point"),
                Matrix: t("./Matrix"),
                Circle: t("./shapes/Circle"),
                Ellipse: t("./shapes/Ellipse"),
                Polygon: t("./shapes/Polygon"),
                Rectangle: t("./shapes/Rectangle"),
                RoundedRectangle: t("./shapes/RoundedRectangle")
            }
        }, {
            "./Matrix": 28,
            "./Point": 29,
            "./shapes/Circle": 31,
            "./shapes/Ellipse": 32,
            "./shapes/Polygon": 33,
            "./shapes/Rectangle": 34,
            "./shapes/RoundedRectangle": 35
        }],
        31: [function(t, e, r) {
            function i(t, e, r) {
                this.x = t || 0, this.y = e || 0, this.radius = r || 0, this.type = o.SHAPES.CIRC
            }
            var n = t("./Rectangle"),
                o = t("../../const");
            i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                return new i(this.x, this.y, this.radius)
            }, i.prototype.contains = function(t, e) {
                if (this.radius <= 0) return !1;
                var r = this.x - t,
                    i = this.y - e,
                    n = this.radius * this.radius;
                return r *= r, i *= i, n >= r + i
            }, i.prototype.getBounds = function() {
                return new n(this.x - this.radius, this.y - this.radius, 2 * this.radius, 2 * this.radius)
            }
        }, {
            "../../const": 20,
            "./Rectangle": 34
        }],
        32: [function(t, e, r) {
            function i(t, e, r, i) {
                this.x = t || 0, this.y = e || 0, this.width = r || 0, this.height = i || 0, this.type = o.SHAPES.ELIP
            }
            var n = t("./Rectangle"),
                o = t("../../const");
            i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                return new i(this.x, this.y, this.width, this.height)
            }, i.prototype.contains = function(t, e) {
                if (this.width <= 0 || this.height <= 0) return !1;
                var r = (t - this.x) / this.width,
                    i = (e - this.y) / this.height;
                return r *= r, i *= i, 1 >= r + i
            }, i.prototype.getBounds = function() {
                return new n(this.x - this.width, this.y - this.height, this.width, this.height)
            }
        }, {
            "../../const": 20,
            "./Rectangle": 34
        }],
        33: [function(t, e, r) {
            function i(t) {
                var e = t;
                if (!Array.isArray(e)) {
                    e = new Array(arguments.length);
                    for (var r = 0; r < e.length; ++r) e[r] = arguments[r]
                }
                if (e[0] instanceof n) {
                    for (var i = [], s = 0, a = e.length; a > s; s++) i.push(e[s].x, e[s].y);
                    e = i
                }
                this.closed = !0, this.points = e, this.type = o.SHAPES.POLY
            }
            var n = t("../Point"),
                o = t("../../const");
            i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                return new i(this.points.slice())
            }, i.prototype.contains = function(t, e) {
                for (var r = !1, i = this.points.length / 2, n = 0, o = i - 1; i > n; o = n++) {
                    var s = this.points[2 * n],
                        a = this.points[2 * n + 1],
                        h = this.points[2 * o],
                        u = this.points[2 * o + 1],
                        l = a > e != u > e && (h - s) * (e - a) / (u - a) + s > t;
                    l && (r = !r)
                }
                return r
            }
        }, {
            "../../const": 20,
            "../Point": 29
        }],
        34: [function(t, e, r) {
            function i(t, e, r, i) {
                this.x = t || 0, this.y = e || 0, this.width = r || 0, this.height = i || 0, this.type = n.SHAPES.RECT
            }
            var n = t("../../const");
            i.prototype.constructor = i, e.exports = i, i.EMPTY = new i(0, 0, 0, 0), i.prototype.clone = function() {
                return new i(this.x, this.y, this.width, this.height)
            }, i.prototype.contains = function(t, e) {
                return this.width <= 0 || this.height <= 0 ? !1 : t >= this.x && t < this.x + this.width && e >= this.y && e < this.y + this.height ? !0 : !1
            }
        }, {
            "../../const": 20
        }],
        35: [function(t, e, r) {
            function i(t, e, r, i, o) {
                this.x = t || 0, this.y = e || 0, this.width = r || 0, this.height = i || 0, this.radius = o || 20, this.type = n.SHAPES.RREC
            }
            var n = t("../../const");
            i.prototype.constructor = i, e.exports = i, i.prototype.clone = function() {
                return new i(this.x, this.y, this.width, this.height, this.radius)
            }, i.prototype.contains = function(t, e) {
                return this.width <= 0 || this.height <= 0 ? !1 : t >= this.x && t <= this.x + this.width && e >= this.y && e <= this.y + this.height ? !0 : !1
            }
        }, {
            "../../const": 20
        }],
        36: [function(t, e, r) {
            function i(t, e, r) {
                n.call(this), r = r || 15e3, t = t || 15e3;
                var i = 16384;
                r > i && (r = i), r > t && (r = t), this._properties = [!1, !0, !1, !1, !1], this._maxSize = t, this._batchSize = r, this._buffers = null, this._bufferToUpdate = 0, this.interactiveChildren = !1, this.blendMode = o.BLEND_MODES.NORMAL, this.roundPixels = !0, this.setProperties(e)
            }
            var n = t("../display/Container"),
                o = t("../const");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.setProperties = function(t) {
                t && (this._properties[0] = "scale" in t ? !!t.scale : this._properties[0], this._properties[1] = "position" in t ? !!t.position : this._properties[1], this._properties[2] = "rotation" in t ? !!t.rotation : this._properties[2], this._properties[3] = "uvs" in t ? !!t.uvs : this._properties[3], this._properties[4] = "alpha" in t ? !!t.alpha : this._properties[4])
            }, i.prototype.updateTransform = function() {
                this.displayObjectUpdateTransform()
            }, i.prototype.renderWebGL = function(t) {
                this.visible && !(this.worldAlpha <= 0) && this.children.length && this.renderable && (t.setObjectRenderer(t.plugins.particle), t.plugins.particle.render(this))
            }, i.prototype.onChildrenChange = function(t) {
                var e = Math.floor(t / this._batchSize);
                e < this._bufferToUpdate && (this._bufferToUpdate = e)
            }, i.prototype.renderCanvas = function(t) {
                if (this.visible && !(this.worldAlpha <= 0) && this.children.length && this.renderable) {
                    var e = t.context,
                        r = this.worldTransform,
                        i = !0,
                        n = 0,
                        o = 0,
                        s = 0,
                        a = 0;
                    e.globalAlpha = this.worldAlpha, this.displayObjectUpdateTransform();
                    for (var h = 0; h < this.children.length; ++h) {
                        var u = this.children[h];
                        if (u.visible) {
                            var l = u.texture.frame;
                            if (e.globalAlpha = this.worldAlpha * u.alpha, u.rotation % (2 * Math.PI) === 0) i && (e.setTransform(r.a, r.b, r.c, r.d, r.tx, r.ty), i = !1), n = u.anchor.x * (-l.width * u.scale.x) + u.position.x + .5, o = u.anchor.y * (-l.height * u.scale.y) + u.position.y + .5, s = l.width * u.scale.x, a = l.height * u.scale.y;
                            else {
                                i || (i = !0), u.displayObjectUpdateTransform();
                                var c = u.worldTransform;
                                t.roundPixels ? e.setTransform(c.a, c.b, c.c, c.d, 0 | c.tx, 0 | c.ty) : e.setTransform(c.a, c.b, c.c, c.d, c.tx, c.ty), n = u.anchor.x * -l.width + .5, o = u.anchor.y * -l.height + .5, s = l.width, a = l.height
                            }
                            e.drawImage(u.texture.baseTexture.source, l.x, l.y, l.width, l.height, n, o, s, a)
                        }
                    }
                }
            }, i.prototype.destroy = function() {
                if (n.prototype.destroy.apply(this, arguments), this._buffers)
                    for (var t = 0; t < this._buffers.length; ++t) this._buffers[t].destroy();
                this._properties = null, this._buffers = null
            }
        }, {
            "../const": 20,
            "../display/Container": 21
        }],
        37: [function(t, e, r) {
            function i(t, e, r, i) {
                this.gl = t, this.vertSize = 2, this.vertByteSize = 4 * this.vertSize, this.size = i, this.dynamicProperties = [], this.staticProperties = [];
                for (var n = 0; n < e.length; n++) {
                    var o = e[n];
                    r[n] ? this.dynamicProperties.push(o) : this.staticProperties.push(o)
                }
                this.staticStride = 0, this.staticBuffer = null, this.staticData = null, this.dynamicStride = 0, this.dynamicBuffer = null, this.dynamicData = null, this.initBuffers()
            }
            i.prototype.constructor = i, e.exports = i, i.prototype.initBuffers = function() {
                var t, e, r = this.gl,
                    i = 0;
                for (this.dynamicStride = 0, t = 0; t < this.dynamicProperties.length; t++) e = this.dynamicProperties[t], e.offset = i, i += e.size, this.dynamicStride += e.size;
                this.dynamicData = new Float32Array(this.size * this.dynamicStride * 4), this.dynamicBuffer = r.createBuffer(), r.bindBuffer(r.ARRAY_BUFFER, this.dynamicBuffer), r.bufferData(r.ARRAY_BUFFER, this.dynamicData, r.DYNAMIC_DRAW);
                var n = 0;
                for (this.staticStride = 0, t = 0; t < this.staticProperties.length; t++) e = this.staticProperties[t], e.offset = n, n += e.size, this.staticStride += e.size;
                this.staticData = new Float32Array(this.size * this.staticStride * 4), this.staticBuffer = r.createBuffer(), r.bindBuffer(r.ARRAY_BUFFER, this.staticBuffer), r.bufferData(r.ARRAY_BUFFER, this.staticData, r.DYNAMIC_DRAW)
            }, i.prototype.uploadDynamic = function(t, e, r) {
                for (var i = this.gl, n = 0; n < this.dynamicProperties.length; n++) {
                    var o = this.dynamicProperties[n];
                    o.uploadFunction(t, e, r, this.dynamicData, this.dynamicStride, o.offset)
                }
                i.bindBuffer(i.ARRAY_BUFFER, this.dynamicBuffer), i.bufferSubData(i.ARRAY_BUFFER, 0, this.dynamicData)
            }, i.prototype.uploadStatic = function(t, e, r) {
                for (var i = this.gl, n = 0; n < this.staticProperties.length; n++) {
                    var o = this.staticProperties[n];
                    o.uploadFunction(t, e, r, this.staticData, this.staticStride, o.offset)
                }
                i.bindBuffer(i.ARRAY_BUFFER, this.staticBuffer), i.bufferSubData(i.ARRAY_BUFFER, 0, this.staticData)
            }, i.prototype.bind = function() {
                var t, e, r = this.gl;
                for (r.bindBuffer(r.ARRAY_BUFFER, this.dynamicBuffer), t = 0; t < this.dynamicProperties.length; t++) e = this.dynamicProperties[t], r.vertexAttribPointer(e.attribute, e.size, r.FLOAT, !1, 4 * this.dynamicStride, 4 * e.offset);
                for (r.bindBuffer(r.ARRAY_BUFFER, this.staticBuffer), t = 0; t < this.staticProperties.length; t++) e = this.staticProperties[t], r.vertexAttribPointer(e.attribute, e.size, r.FLOAT, !1, 4 * this.staticStride, 4 * e.offset)
            }, i.prototype.destroy = function() {
                this.dynamicProperties = null, this.dynamicData = null, this.gl.deleteBuffer(this.dynamicBuffer), this.staticProperties = null, this.staticData = null, this.gl.deleteBuffer(this.staticBuffer)
            }
        }, {}],
        38: [function(t, e, r) {
            function i(t) {
                n.call(this, t);
                var e = 98304;
                this.indices = new Uint16Array(e);
                for (var r = 0, i = 0; e > r; r += 6, i += 4) this.indices[r + 0] = i + 0, this.indices[r + 1] = i + 1, this.indices[r + 2] = i + 2, this.indices[r + 3] = i + 0, this.indices[r + 4] = i + 2, this.indices[r + 5] = i + 3;
                this.shader = null, this.indexBuffer = null, this.properties = null, this.tempMatrix = new h.Matrix
            }
            var n = t("../../renderers/webgl/utils/ObjectRenderer"),
                o = t("../../renderers/webgl/WebGLRenderer"),
                s = t("./ParticleShader"),
                a = t("./ParticleBuffer"),
                h = t("../../math");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, o.registerPlugin("particle", i), i.prototype.onContextChange = function() {
                var t = this.renderer.gl;
                this.shader = new s(this.renderer.shaderManager), this.indexBuffer = t.createBuffer(), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indexBuffer), t.bufferData(t.ELEMENT_ARRAY_BUFFER, this.indices, t.STATIC_DRAW), this.properties = [{
                    attribute: this.shader.attributes.aVertexPosition,
                    size: 2,
                    uploadFunction: this.uploadVertices,
                    offset: 0
                }, {
                    attribute: this.shader.attributes.aPositionCoord,
                    size: 2,
                    uploadFunction: this.uploadPosition,
                    offset: 0
                }, {
                    attribute: this.shader.attributes.aRotation,
                    size: 1,
                    uploadFunction: this.uploadRotation,
                    offset: 0
                }, {
                    attribute: this.shader.attributes.aTextureCoord,
                    size: 2,
                    uploadFunction: this.uploadUvs,
                    offset: 0
                }, {
                    attribute: this.shader.attributes.aColor,
                    size: 1,
                    uploadFunction: this.uploadAlpha,
                    offset: 0
                }]
            }, i.prototype.start = function() {
                var t = this.renderer.gl;
                t.activeTexture(t.TEXTURE0), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                var e = this.shader;
                this.renderer.shaderManager.setShader(e)
            }, i.prototype.render = function(t) {
                var e = t.children,
                    r = e.length,
                    i = t._maxSize,
                    n = t._batchSize;
                if (0 !== r) {
                    r > i && (r = i), t._buffers || (t._buffers = this.generateBuffers(t)), this.renderer.blendModeManager.setBlendMode(t.blendMode);
                    var o = this.renderer.gl,
                        s = t.worldTransform.copy(this.tempMatrix);
                    s.prepend(this.renderer.currentRenderTarget.projectionMatrix), o.uniformMatrix3fv(this.shader.uniforms.projectionMatrix._location, !1, s.toArray(!0)), o.uniform1f(this.shader.uniforms.uAlpha._location, t.worldAlpha);
                    var a = e[0]._texture.baseTexture;
                    if (a._glTextures[o.id]) o.bindTexture(o.TEXTURE_2D, a._glTextures[o.id]);
                    else {
                        if (!this.renderer.updateTexture(a)) return;
                        t._properties[0] && t._properties[3] || (t._bufferToUpdate = 0)
                    }
                    for (var h = 0, u = 0; r > h; h += n, u += 1) {
                        var l = r - h;
                        l > n && (l = n);
                        var c = t._buffers[u];
                        c.uploadDynamic(e, h, l), t._bufferToUpdate === u && (c.uploadStatic(e, h, l), t._bufferToUpdate = u + 1), c.bind(this.shader), o.drawElements(o.TRIANGLES, 6 * l, o.UNSIGNED_SHORT, 0), this.renderer.drawCount++
                    }
                }
            }, i.prototype.generateBuffers = function(t) {
                var e, r = this.renderer.gl,
                    i = [],
                    n = t._maxSize,
                    o = t._batchSize,
                    s = t._properties;
                for (e = 0; n > e; e += o) i.push(new a(r, this.properties, s, o));
                return i
            }, i.prototype.uploadVertices = function(t, e, r, i, n, o) {
                for (var s, a, h, u, l, c, p, d, f, v = 0; r > v; v++) s = t[e + v], a = s._texture, u = s.scale.x, l = s.scale.y, a.trim ? (h = a.trim, p = h.x - s.anchor.x * h.width, c = p + a.crop.width, f = h.y - s.anchor.y * h.height, d = f + a.crop.height) : (c = a._frame.width * (1 - s.anchor.x), p = a._frame.width * -s.anchor.x, d = a._frame.height * (1 - s.anchor.y), f = a._frame.height * -s.anchor.y), i[o] = p * u, i[o + 1] = f * l, i[o + n] = c * u, i[o + n + 1] = f * l, i[o + 2 * n] = c * u, i[o + 2 * n + 1] = d * l, i[o + 3 * n] = p * u, i[o + 3 * n + 1] = d * l, o += 4 * n
            }, i.prototype.uploadPosition = function(t, e, r, i, n, o) {
                for (var s = 0; r > s; s++) {
                    var a = t[e + s].position;
                    i[o] = a.x, i[o + 1] = a.y, i[o + n] = a.x, i[o + n + 1] = a.y, i[o + 2 * n] = a.x, i[o + 2 * n + 1] = a.y, i[o + 3 * n] = a.x, i[o + 3 * n + 1] = a.y, o += 4 * n
                }
            }, i.prototype.uploadRotation = function(t, e, r, i, n, o) {
                for (var s = 0; r > s; s++) {
                    var a = t[e + s].rotation;
                    i[o] = a, i[o + n] = a, i[o + 2 * n] = a, i[o + 3 * n] = a, o += 4 * n
                }
            }, i.prototype.uploadUvs = function(t, e, r, i, n, o) {
                for (var s = 0; r > s; s++) {
                    var a = t[e + s]._texture._uvs;
                    a ? (i[o] = a.x0, i[o + 1] = a.y0, i[o + n] = a.x1, i[o + n + 1] = a.y1, i[o + 2 * n] = a.x2, i[o + 2 * n + 1] = a.y2, i[o + 3 * n] = a.x3, i[o + 3 * n + 1] = a.y3, o += 4 * n) : (i[o] = 0, i[o + 1] = 0, i[o + n] = 0, i[o + n + 1] = 0, i[o + 2 * n] = 0, i[o + 2 * n + 1] = 0, i[o + 3 * n] = 0, i[o + 3 * n + 1] = 0, o += 4 * n)
                }
            }, i.prototype.uploadAlpha = function(t, e, r, i, n, o) {
                for (var s = 0; r > s; s++) {
                    var a = t[e + s].alpha;
                    i[o] = a, i[o + n] = a, i[o + 2 * n] = a, i[o + 3 * n] = a, o += 4 * n
                }
            }, i.prototype.destroy = function() {
                this.renderer.gl && this.renderer.gl.deleteBuffer(this.indexBuffer), n.prototype.destroy.apply(this, arguments), this.shader.destroy(), this.indices = null, this.tempMatrix = null
            }
        }, {
            "../../math": 30,
            "../../renderers/webgl/WebGLRenderer": 46,
            "../../renderers/webgl/utils/ObjectRenderer": 60,
            "./ParticleBuffer": 37,
            "./ParticleShader": 39
        }],
        39: [function(t, e, r) {
            function i(t) {
                n.call(this, t, ["attribute vec2 aVertexPosition;", "attribute vec2 aTextureCoord;", "attribute float aColor;", "attribute vec2 aPositionCoord;", "attribute vec2 aScale;", "attribute float aRotation;", "uniform mat3 projectionMatrix;", "varying vec2 vTextureCoord;", "varying float vColor;", "void main(void){", "   vec2 v = aVertexPosition;", "   v.x = (aVertexPosition.x) * cos(aRotation) - (aVertexPosition.y) * sin(aRotation);", "   v.y = (aVertexPosition.x) * sin(aRotation) + (aVertexPosition.y) * cos(aRotation);", "   v = v + aPositionCoord;", "   gl_Position = vec4((projectionMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);", "   vTextureCoord = aTextureCoord;", "   vColor = aColor;", "}"].join("\n"), ["precision lowp float;", "varying vec2 vTextureCoord;", "varying float vColor;", "uniform sampler2D uSampler;", "uniform float uAlpha;", "void main(void){", "  vec4 color = texture2D(uSampler, vTextureCoord) * vColor * uAlpha;", "  if (color.a == 0.0) discard;", "  gl_FragColor = color;", "}"].join("\n"), {
                    uAlpha: {
                        type: "1f",
                        value: 1
                    }
                }, {
                    aPositionCoord: 0,
                    aRotation: 0
                })
            }
            var n = t("../../renderers/webgl/shaders/TextureShader");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i
        }, {
            "../../renderers/webgl/shaders/TextureShader": 59
        }],
        40: [function(t, e, r) {
            function i(t, e, r, i) {
                if (a.call(this), n.sayHello(t), i)
                    for (var h in s.DEFAULT_RENDER_OPTIONS) "undefined" == typeof i[h] && (i[h] = s.DEFAULT_RENDER_OPTIONS[h]);
                else i = s.DEFAULT_RENDER_OPTIONS;
                this.type = s.RENDERER_TYPE.UNKNOWN, this.width = e || 800, this.height = r || 600, this.view = i.view || document.createElement("canvas"), this.resolution = i.resolution, this.transparent = i.transparent, this.autoResize = i.autoResize || !1, this.blendModes = null, this.preserveDrawingBuffer = i.preserveDrawingBuffer, this.clearBeforeRender = i.clearBeforeRender, this.roundPixels = i.roundPixels, this._backgroundColor = 0, this._backgroundColorRgb = [0, 0, 0], this._backgroundColorString = "#000000", this.backgroundColor = i.backgroundColor || this._backgroundColor, this._tempDisplayObjectParent = {
                    worldTransform: new o.Matrix,
                    worldAlpha: 1,
                    children: []
                }, this._lastObjectRendered = this._tempDisplayObjectParent
            }
            var n = t("../utils"),
                o = t("../math"),
                s = t("../const"),
                a = t("eventemitter3");
            i.prototype = Object.create(a.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                backgroundColor: {
                    get: function() {
                        return this._backgroundColor
                    },
                    set: function(t) {
                        this._backgroundColor = t, this._backgroundColorString = n.hex2string(t), n.hex2rgb(t, this._backgroundColorRgb)
                    }
                }
            }), i.prototype.resize = function(t, e) {
                this.width = t * this.resolution, this.height = e * this.resolution, this.view.width = this.width, this.view.height = this.height, this.autoResize && (this.view.style.width = this.width / this.resolution + "px", this.view.style.height = this.height / this.resolution + "px")
            }, i.prototype.destroy = function(t) {
                t && this.view.parentNode && this.view.parentNode.removeChild(this.view), this.type = s.RENDERER_TYPE.UNKNOWN, this.width = 0, this.height = 0, this.view = null, this.resolution = 0, this.transparent = !1, this.autoResize = !1, this.blendModes = null, this.preserveDrawingBuffer = !1, this.clearBeforeRender = !1, this.roundPixels = !1, this._backgroundColor = 0, this._backgroundColorRgb = null, this._backgroundColorString = null
            }
        }, {
            "../const": 20,
            "../math": 30,
            "../utils": 74,
            eventemitter3: 10
        }],
        41: [function(t, e, r) {
            function i(t, e, r) {
                r = r || {}, n.call(this, "Canvas", t, e, r), this.type = h.RENDERER_TYPE.CANVAS, this.context = this.view.getContext("2d", {
                    alpha: this.transparent
                }), this.refresh = !0, this.maskManager = new o, this.smoothProperty = "imageSmoothingEnabled", this.context.imageSmoothingEnabled || (this.context.webkitImageSmoothingEnabled ? this.smoothProperty = "webkitImageSmoothingEnabled" : this.context.mozImageSmoothingEnabled ? this.smoothProperty = "mozImageSmoothingEnabled" : this.context.oImageSmoothingEnabled ? this.smoothProperty = "oImageSmoothingEnabled" : this.context.msImageSmoothingEnabled && (this.smoothProperty = "msImageSmoothingEnabled")), this.initPlugins(), this._mapBlendModes(), this._tempDisplayObjectParent = {
                    worldTransform: new a.Matrix,
                    worldAlpha: 1
                }, this.resize(t, e)
            }
            var n = t("../SystemRenderer"),
                o = t("./utils/CanvasMaskManager"),
                s = t("../../utils"),
                a = t("../../math"),
                h = t("../../const");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, s.pluginTarget.mixin(i), i.prototype.render = function(t) {
                var e = t.parent;
                this._lastObjectRendered = t, t.parent = this._tempDisplayObjectParent, t.updateTransform(), t.parent = e, this.context.setTransform(1, 0, 0, 1, 0, 0), this.context.globalAlpha = 1, this.context.globalCompositeOperation = this.blendModes[h.BLEND_MODES.NORMAL], navigator.isCocoonJS && this.view.screencanvas && (this.context.fillStyle = "black", this.context.clear()), this.clearBeforeRender && (this.transparent ? this.context.clearRect(0, 0, this.width, this.height) : (this.context.fillStyle = this._backgroundColorString, this.context.fillRect(0, 0, this.width, this.height))), this.renderDisplayObject(t, this.context)
            }, i.prototype.destroy = function(t) {
                this.destroyPlugins(), n.prototype.destroy.call(this, t), this.context = null, this.refresh = !0, this.maskManager.destroy(), this.maskManager = null, this.smoothProperty = null
            }, i.prototype.renderDisplayObject = function(t, e) {
                var r = this.context;
                this.context = e, t.renderCanvas(this), this.context = r
            }, i.prototype.resize = function(t, e) {
                n.prototype.resize.call(this, t, e), this.smoothProperty && (this.context[this.smoothProperty] = h.SCALE_MODES.DEFAULT === h.SCALE_MODES.LINEAR)
            }, i.prototype._mapBlendModes = function() {
                this.blendModes || (this.blendModes = {}, s.canUseNewCanvasBlendModes() ? (this.blendModes[h.BLEND_MODES.NORMAL] = "source-over", this.blendModes[h.BLEND_MODES.ADD] = "lighter", this.blendModes[h.BLEND_MODES.MULTIPLY] = "multiply", this.blendModes[h.BLEND_MODES.SCREEN] = "screen", this.blendModes[h.BLEND_MODES.OVERLAY] = "overlay", this.blendModes[h.BLEND_MODES.DARKEN] = "darken", this.blendModes[h.BLEND_MODES.LIGHTEN] = "lighten", this.blendModes[h.BLEND_MODES.COLOR_DODGE] = "color-dodge", this.blendModes[h.BLEND_MODES.COLOR_BURN] = "color-burn", this.blendModes[h.BLEND_MODES.HARD_LIGHT] = "hard-light", this.blendModes[h.BLEND_MODES.SOFT_LIGHT] = "soft-light", this.blendModes[h.BLEND_MODES.DIFFERENCE] = "difference", this.blendModes[h.BLEND_MODES.EXCLUSION] = "exclusion", this.blendModes[h.BLEND_MODES.HUE] = "hue", this.blendModes[h.BLEND_MODES.SATURATION] = "saturate", this.blendModes[h.BLEND_MODES.COLOR] = "color", this.blendModes[h.BLEND_MODES.LUMINOSITY] = "luminosity") : (this.blendModes[h.BLEND_MODES.NORMAL] = "source-over", this.blendModes[h.BLEND_MODES.ADD] = "lighter", this.blendModes[h.BLEND_MODES.MULTIPLY] = "source-over", this.blendModes[h.BLEND_MODES.SCREEN] = "source-over", this.blendModes[h.BLEND_MODES.OVERLAY] = "source-over", this.blendModes[h.BLEND_MODES.DARKEN] = "source-over", this.blendModes[h.BLEND_MODES.LIGHTEN] = "source-over", this.blendModes[h.BLEND_MODES.COLOR_DODGE] = "source-over", this.blendModes[h.BLEND_MODES.COLOR_BURN] = "source-over", this.blendModes[h.BLEND_MODES.HARD_LIGHT] = "source-over", this.blendModes[h.BLEND_MODES.SOFT_LIGHT] = "source-over", this.blendModes[h.BLEND_MODES.DIFFERENCE] = "source-over", this.blendModes[h.BLEND_MODES.EXCLUSION] = "source-over", this.blendModes[h.BLEND_MODES.HUE] = "source-over", this.blendModes[h.BLEND_MODES.SATURATION] = "source-over", this.blendModes[h.BLEND_MODES.COLOR] = "source-over", this.blendModes[h.BLEND_MODES.LUMINOSITY] = "source-over"))
            }
        }, {
            "../../const": 20,
            "../../math": 30,
            "../../utils": 74,
            "../SystemRenderer": 40,
            "./utils/CanvasMaskManager": 44
        }],
        42: [function(t, e, r) {
            function i(t, e) {
                this.canvas = document.createElement("canvas"), this.context = this.canvas.getContext("2d"), this.canvas.width = t, this.canvas.height = e
            }
            i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                width: {
                    get: function() {
                        return this.canvas.width
                    },
                    set: function(t) {
                        this.canvas.width = t
                    }
                },
                height: {
                    get: function() {
                        return this.canvas.height
                    },
                    set: function(t) {
                        this.canvas.height = t
                    }
                }
            }), i.prototype.clear = function() {
                this.context.setTransform(1, 0, 0, 1, 0, 0), this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            }, i.prototype.resize = function(t, e) {
                this.canvas.width = t, this.canvas.height = e
            }, i.prototype.destroy = function() {
                this.context = null, this.canvas = null
            }
        }, {}],
        43: [function(t, e, r) {
            var i = t("../../../const"),
                n = {};
            e.exports = n, n.renderGraphics = function(t, e) {
                var r = t.worldAlpha;
                t.dirty && (this.updateGraphicsTint(t), t.dirty = !1);
                for (var n = 0; n < t.graphicsData.length; n++) {
                    var o = t.graphicsData[n],
                        s = o.shape,
                        a = o._fillTint,
                        h = o._lineTint;
                    if (e.lineWidth = o.lineWidth, o.type === i.SHAPES.POLY) {
                        e.beginPath();
                        var u = s.points;
                        e.moveTo(u[0], u[1]);
                        for (var l = 1; l < u.length / 2; l++) e.lineTo(u[2 * l], u[2 * l + 1]);
                        s.closed && e.lineTo(u[0], u[1]), u[0] === u[u.length - 2] && u[1] === u[u.length - 1] && e.closePath(), o.fill && (e.globalAlpha = o.fillAlpha * r, e.fillStyle = "#" + ("00000" + (0 | a).toString(16)).substr(-6), e.fill()), o.lineWidth && (e.globalAlpha = o.lineAlpha * r, e.strokeStyle = "#" + ("00000" + (0 | h).toString(16)).substr(-6), e.stroke())
                    } else if (o.type === i.SHAPES.RECT)(o.fillColor || 0 === o.fillColor) && (e.globalAlpha = o.fillAlpha * r, e.fillStyle = "#" + ("00000" + (0 | a).toString(16)).substr(-6), e.fillRect(s.x, s.y, s.width, s.height)), o.lineWidth && (e.globalAlpha = o.lineAlpha * r, e.strokeStyle = "#" + ("00000" + (0 | h).toString(16)).substr(-6), e.strokeRect(s.x, s.y, s.width, s.height));
                    else if (o.type === i.SHAPES.CIRC) e.beginPath(), e.arc(s.x, s.y, s.radius, 0, 2 * Math.PI), e.closePath(), o.fill && (e.globalAlpha = o.fillAlpha * r, e.fillStyle = "#" + ("00000" + (0 | a).toString(16)).substr(-6), e.fill()), o.lineWidth && (e.globalAlpha = o.lineAlpha * r, e.strokeStyle = "#" + ("00000" + (0 | h).toString(16)).substr(-6), e.stroke());
                    else if (o.type === i.SHAPES.ELIP) {
                        var c = 2 * s.width,
                            p = 2 * s.height,
                            d = s.x - c / 2,
                            f = s.y - p / 2;
                        e.beginPath();
                        var v = .5522848,
                            g = c / 2 * v,
                            m = p / 2 * v,
                            y = d + c,
                            x = f + p,
                            b = d + c / 2,
                            _ = f + p / 2;
                        e.moveTo(d, _), e.bezierCurveTo(d, _ - m, b - g, f, b, f), e.bezierCurveTo(b + g, f, y, _ - m, y, _), e.bezierCurveTo(y, _ + m, b + g, x, b, x), e.bezierCurveTo(b - g, x, d, _ + m, d, _), e.closePath(), o.fill && (e.globalAlpha = o.fillAlpha * r, e.fillStyle = "#" + ("00000" + (0 | a).toString(16)).substr(-6), e.fill()), o.lineWidth && (e.globalAlpha = o.lineAlpha * r, e.strokeStyle = "#" + ("00000" + (0 | h).toString(16)).substr(-6), e.stroke())
                    } else if (o.type === i.SHAPES.RREC) {
                        var T = s.x,
                            E = s.y,
                            S = s.width,
                            w = s.height,
                            A = s.radius,
                            C = Math.min(S, w) / 2 | 0;
                        A = A > C ? C : A, e.beginPath(), e.moveTo(T, E + A), e.lineTo(T, E + w - A), e.quadraticCurveTo(T, E + w, T + A, E + w), e.lineTo(T + S - A, E + w), e.quadraticCurveTo(T + S, E + w, T + S, E + w - A), e.lineTo(T + S, E + A), e.quadraticCurveTo(T + S, E, T + S - A, E), e.lineTo(T + A, E), e.quadraticCurveTo(T, E, T, E + A), e.closePath(), (o.fillColor || 0 === o.fillColor) && (e.globalAlpha = o.fillAlpha * r, e.fillStyle = "#" + ("00000" + (0 | a).toString(16)).substr(-6), e.fill()), o.lineWidth && (e.globalAlpha = o.lineAlpha * r, e.strokeStyle = "#" + ("00000" + (0 | h).toString(16)).substr(-6), e.stroke())
                    }
                }
            }, n.renderGraphicsMask = function(t, e) {
                var r = t.graphicsData.length;
                if (0 !== r) {
                    e.beginPath();
                    for (var n = 0; r > n; n++) {
                        var o = t.graphicsData[n],
                            s = o.shape;
                        if (o.type === i.SHAPES.POLY) {
                            var a = s.points;
                            e.moveTo(a[0], a[1]);
                            for (var h = 1; h < a.length / 2; h++) e.lineTo(a[2 * h], a[2 * h + 1]);
                            a[0] === a[a.length - 2] && a[1] === a[a.length - 1] && e.closePath()
                        } else if (o.type === i.SHAPES.RECT) e.rect(s.x, s.y, s.width, s.height), e.closePath();
                        else if (o.type === i.SHAPES.CIRC) e.arc(s.x, s.y, s.radius, 0, 2 * Math.PI), e.closePath();
                        else if (o.type === i.SHAPES.ELIP) {
                            var u = 2 * s.width,
                                l = 2 * s.height,
                                c = s.x - u / 2,
                                p = s.y - l / 2,
                                d = .5522848,
                                f = u / 2 * d,
                                v = l / 2 * d,
                                g = c + u,
                                m = p + l,
                                y = c + u / 2,
                                x = p + l / 2;
                            e.moveTo(c, x), e.bezierCurveTo(c, x - v, y - f, p, y, p), e.bezierCurveTo(y + f, p, g, x - v, g, x), e.bezierCurveTo(g, x + v, y + f, m, y, m), e.bezierCurveTo(y - f, m, c, x + v, c, x), e.closePath()
                        } else if (o.type === i.SHAPES.RREC) {
                            var b = s.x,
                                _ = s.y,
                                T = s.width,
                                E = s.height,
                                S = s.radius,
                                w = Math.min(T, E) / 2 | 0;
                            S = S > w ? w : S, e.moveTo(b, _ + S), e.lineTo(b, _ + E - S), e.quadraticCurveTo(b, _ + E, b + S, _ + E), e.lineTo(b + T - S, _ + E), e.quadraticCurveTo(b + T, _ + E, b + T, _ + E - S), e.lineTo(b + T, _ + S), e.quadraticCurveTo(b + T, _, b + T - S, _), e.lineTo(b + S, _), e.quadraticCurveTo(b, _, b, _ + S), e.closePath()
                        }
                    }
                }
            }, n.updateGraphicsTint = function(t) {
                if (16777215 !== t.tint || t._prevTint !== t.tint) {
                    t._prevTint = t.tint;
                    for (var e = (t.tint >> 16 & 255) / 255, r = (t.tint >> 8 & 255) / 255, i = (255 & t.tint) / 255, n = 0; n < t.graphicsData.length; n++) {
                        var o = t.graphicsData[n],
                            s = 0 | o.fillColor,
                            a = 0 | o.lineColor;
                        o._fillTint = ((s >> 16 & 255) / 255 * e * 255 << 16) + ((s >> 8 & 255) / 255 * r * 255 << 8) + (255 & s) / 255 * i * 255, o._lineTint = ((a >> 16 & 255) / 255 * e * 255 << 16) + ((a >> 8 & 255) / 255 * r * 255 << 8) + (255 & a) / 255 * i * 255
                    }
                }
            }
        }, {
            "../../../const": 20
        }],
        44: [function(t, e, r) {
            function i() {}
            var n = t("./CanvasGraphics");
            i.prototype.constructor = i, e.exports = i, i.prototype.pushMask = function(t, e) {
                e.context.save();
                var r = t.alpha,
                    i = t.worldTransform,
                    o = e.resolution;
                e.context.setTransform(i.a * o, i.b * o, i.c * o, i.d * o, i.tx * o, i.ty * o), t.texture || (n.renderGraphicsMask(t, e.context), e.context.clip()), t.worldAlpha = r
            }, i.prototype.popMask = function(t) {
                t.context.restore()
            }, i.prototype.destroy = function() {}
        }, {
            "./CanvasGraphics": 43
        }],
        45: [function(t, e, r) {
            var i = t("../../../utils"),
                n = {};
            e.exports = n, n.getTintedTexture = function(t, e) {
                var r = t.texture;
                e = n.roundColor(e);
                var i = "#" + ("00000" + (0 | e).toString(16)).substr(-6);
                if (r.tintCache = r.tintCache || {}, r.tintCache[i]) return r.tintCache[i];
                var o = n.canvas || document.createElement("canvas");
                if (n.tintMethod(r, e, o), n.convertTintToImage) {
                    var s = new Image;
                    s.src = o.toDataURL(), r.tintCache[i] = s
                } else r.tintCache[i] = o, n.canvas = null;
                return o
            }, n.tintWithMultiply = function(t, e, r) {
                var i = r.getContext("2d"),
                    n = t.baseTexture.resolution,
                    o = t.crop.clone();
                o.x *= n, o.y *= n, o.width *= n, o.height *= n, r.width = o.width, r.height = o.height, i.fillStyle = "#" + ("00000" + (0 | e).toString(16)).substr(-6), i.fillRect(0, 0, o.width, o.height), i.globalCompositeOperation = "multiply", i.drawImage(t.baseTexture.source, o.x, o.y, o.width, o.height, 0, 0, o.width, o.height), i.globalCompositeOperation = "destination-atop", i.drawImage(t.baseTexture.source, o.x, o.y, o.width, o.height, 0, 0, o.width, o.height)
            }, n.tintWithOverlay = function(t, e, r) {
                var i = r.getContext("2d"),
                    n = t.baseTexture.resolution,
                    o = t.crop.clone();
                o.x *= n, o.y *= n, o.width *= n, o.height *= n, r.width = o.width, r.height = o.height, i.globalCompositeOperation = "copy", i.fillStyle = "#" + ("00000" + (0 | e).toString(16)).substr(-6), i.fillRect(0, 0, o.width, o.height), i.globalCompositeOperation = "destination-atop", i.drawImage(t.baseTexture.source, o.x, o.y, o.width, o.height, 0, 0, o.width, o.height)
            }, n.tintWithPerPixel = function(t, e, r) {
                var n = r.getContext("2d"),
                    o = t.baseTexture.resolution,
                    s = t.crop.clone();
                s.x *= o, s.y *= o, s.width *= o, s.height *= o, r.width = s.width, r.height = s.height, n.globalCompositeOperation = "copy", n.drawImage(t.baseTexture.source, s.x, s.y, s.width, s.height, 0, 0, s.width, s.height);
                for (var a = i.hex2rgb(e), h = a[0], u = a[1], l = a[2], c = n.getImageData(0, 0, s.width, s.height), p = c.data, d = 0; d < p.length; d += 4) p[d + 0] *= h, p[d + 1] *= u, p[d + 2] *= l;
                n.putImageData(c, 0, 0)
            }, n.roundColor = function(t) {
                var e = n.cacheStepsPerColorChannel,
                    r = i.hex2rgb(t);
                return r[0] = Math.min(255, r[0] / e * e), r[1] = Math.min(255, r[1] / e * e), r[2] = Math.min(255, r[2] / e * e), i.rgb2hex(r)
            }, n.cacheStepsPerColorChannel = 8, n.convertTintToImage = !1, n.canUseMultiply = i.canUseNewCanvasBlendModes(), n.tintMethod = n.canUseMultiply ? n.tintWithMultiply : n.tintWithPerPixel
        }, {
            "../../../utils": 74
        }],
        46: [function(t, e, r) {
            function i(t, e, r) {
                r = r || {}, n.call(this, "WebGL", t, e, r), this.type = f.RENDERER_TYPE.WEBGL, this.handleContextLost = this.handleContextLost.bind(this), this.handleContextRestored = this.handleContextRestored.bind(this), this.view.addEventListener("webglcontextlost", this.handleContextLost, !1), this.view.addEventListener("webglcontextrestored", this.handleContextRestored, !1), this._useFXAA = !!r.forceFXAA && r.antialias, this._FXAAFilter = null, this._contextOptions = {
                    alpha: this.transparent,
                    antialias: r.antialias,
                    premultipliedAlpha: this.transparent && "notMultiplied" !== this.transparent,
                    stencil: !0,
                    preserveDrawingBuffer: r.preserveDrawingBuffer
                }, this.drawCount = 0, this.shaderManager = new o(this), this.maskManager = new s(this), this.stencilManager = new a(this), this.filterManager = new h(this), this.blendModeManager = new u(this), this.currentRenderTarget = null, this.currentRenderer = new c(this), this.initPlugins(), this._createContext(), this._initContext(), this._mapGlModes(), this._renderTargetStack = []
            }
            var n = t("../SystemRenderer"),
                o = t("./managers/ShaderManager"),
                s = t("./managers/MaskManager"),
                a = t("./managers/StencilManager"),
                h = t("./managers/FilterManager"),
                u = t("./managers/BlendModeManager"),
                l = t("./utils/RenderTarget"),
                c = t("./utils/ObjectRenderer"),
                p = t("./filters/FXAAFilter"),
                d = t("../../utils"),
                f = t("../../const");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, d.pluginTarget.mixin(i), i.glContextId = 0, i.prototype._createContext = function() {
                var t = this.view.getContext("webgl", this._contextOptions) || this.view.getContext("experimental-webgl", this._contextOptions);
                if (this.gl = t, !t) throw new Error("This browser does not support webGL. Try using the canvas renderer");
                this.glContextId = i.glContextId++, t.id = this.glContextId, t.renderer = this
            }, i.prototype._initContext = function() {
                var t = this.gl;
                t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.enable(t.BLEND), this.renderTarget = new l(t, this.width, this.height, null, this.resolution, !0), this.setRenderTarget(this.renderTarget), this.emit("context", t), this.resize(this.width, this.height), this._useFXAA || (this._useFXAA = this._contextOptions.antialias && !t.getContextAttributes().antialias), this._useFXAA && (window.console.warn("FXAA antialiasing being used instead of native antialiasing"), this._FXAAFilter = [new p])
            }, i.prototype.render = function(t) {
                if (!this.gl.isContextLost()) {
                    this.drawCount = 0, this._lastObjectRendered = t, this._useFXAA && (this._FXAAFilter[0].uniforms.resolution.value.x = this.width, this._FXAAFilter[0].uniforms.resolution.value.y = this.height, t.filterArea = this.renderTarget.size, t.filters = this._FXAAFilter);
                    var e = t.parent;
                    t.parent = this._tempDisplayObjectParent, t.updateTransform(), t.parent = e;
                    var r = this.gl;
                    this.setRenderTarget(this.renderTarget), this.clearBeforeRender && (this.transparent ? r.clearColor(0, 0, 0, 0) : r.clearColor(this._backgroundColorRgb[0], this._backgroundColorRgb[1], this._backgroundColorRgb[2], 1), r.clear(r.COLOR_BUFFER_BIT)), this.renderDisplayObject(t, this.renderTarget)
                }
            }, i.prototype.renderDisplayObject = function(t, e, r) {
                this.setRenderTarget(e), r && e.clear(), this.filterManager.setFilterStack(e.filterStack), t.renderWebGL(this), this.currentRenderer.flush()
            }, i.prototype.setObjectRenderer = function(t) {
                this.currentRenderer !== t && (this.currentRenderer.stop(), this.currentRenderer = t, this.currentRenderer.start())
            }, i.prototype.setRenderTarget = function(t) {
                this.currentRenderTarget !== t && (this.currentRenderTarget = t, this.currentRenderTarget.activate(), this.stencilManager.setMaskStack(t.stencilMaskStack))
            }, i.prototype.resize = function(t, e) {
                n.prototype.resize.call(this, t, e), this.filterManager.resize(t, e), this.renderTarget.resize(t, e), this.currentRenderTarget === this.renderTarget && (this.renderTarget.activate(), this.gl.viewport(0, 0, this.width, this.height))
            }, i.prototype.updateTexture = function(t) {
                if (t = t.baseTexture || t, t.hasLoaded) {
                    var e = this.gl;
                    return t._glTextures[e.id] || (t._glTextures[e.id] = e.createTexture(), t.on("update", this.updateTexture, this), t.on("dispose", this.destroyTexture, this)), e.bindTexture(e.TEXTURE_2D, t._glTextures[e.id]), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, t.premultipliedAlpha), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t.source), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, t.scaleMode === f.SCALE_MODES.LINEAR ? e.LINEAR : e.NEAREST), t.mipmap && t.isPowerOfTwo ? (e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, t.scaleMode === f.SCALE_MODES.LINEAR ? e.LINEAR_MIPMAP_LINEAR : e.NEAREST_MIPMAP_NEAREST), e.generateMipmap(e.TEXTURE_2D)) : e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, t.scaleMode === f.SCALE_MODES.LINEAR ? e.LINEAR : e.NEAREST), t.isPowerOfTwo ? (e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.REPEAT), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.REPEAT)) : (e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE)), t._glTextures[e.id]
                }
            }, i.prototype.destroyTexture = function(t) {
                t = t.baseTexture || t, t.hasLoaded && t._glTextures[this.gl.id] && this.gl.deleteTexture(t._glTextures[this.gl.id])
            }, i.prototype.handleContextLost = function(t) {
                t.preventDefault()
            }, i.prototype.handleContextRestored = function() {
                this._initContext();
                for (var t in d.BaseTextureCache) d.BaseTextureCache[t]._glTextures.length = 0
            }, i.prototype.destroy = function(t) {
                this.destroyPlugins(), this.view.removeEventListener("webglcontextlost", this.handleContextLost), this.view.removeEventListener("webglcontextrestored", this.handleContextRestored);
                for (var e in d.BaseTextureCache) {
                    var r = d.BaseTextureCache[e];
                    r.off("update", this.updateTexture, this), r.off("dispose", this.destroyTexture, this)
                }
                n.prototype.destroy.call(this, t), this.uid = 0, this.shaderManager.destroy(), this.maskManager.destroy(), this.stencilManager.destroy(), this.filterManager.destroy(), this.blendModeManager.destroy(), this.shaderManager = null, this.maskManager = null, this.filterManager = null, this.blendModeManager = null, this.currentRenderer = null, this.handleContextLost = null, this.handleContextRestored = null, this._contextOptions = null, this.drawCount = 0, this.gl.useProgram(null), this.gl = null
            }, i.prototype._mapGlModes = function() {
                var t = this.gl;
                this.blendModes || (this.blendModes = {}, this.blendModes[f.BLEND_MODES.NORMAL] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.ADD] = [t.SRC_ALPHA, t.DST_ALPHA], this.blendModes[f.BLEND_MODES.MULTIPLY] = [t.DST_COLOR, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.SCREEN] = [t.SRC_ALPHA, t.ONE], this.blendModes[f.BLEND_MODES.OVERLAY] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.DARKEN] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.LIGHTEN] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.COLOR_DODGE] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.COLOR_BURN] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.HARD_LIGHT] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.SOFT_LIGHT] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.DIFFERENCE] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.EXCLUSION] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.HUE] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.SATURATION] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.COLOR] = [t.ONE, t.ONE_MINUS_SRC_ALPHA], this.blendModes[f.BLEND_MODES.LUMINOSITY] = [t.ONE, t.ONE_MINUS_SRC_ALPHA]), this.drawModes || (this.drawModes = {}, this.drawModes[f.DRAW_MODES.POINTS] = t.POINTS, this.drawModes[f.DRAW_MODES.LINES] = t.LINES, this.drawModes[f.DRAW_MODES.LINE_LOOP] = t.LINE_LOOP, this.drawModes[f.DRAW_MODES.LINE_STRIP] = t.LINE_STRIP, this.drawModes[f.DRAW_MODES.TRIANGLES] = t.TRIANGLES, this.drawModes[f.DRAW_MODES.TRIANGLE_STRIP] = t.TRIANGLE_STRIP, this.drawModes[f.DRAW_MODES.TRIANGLE_FAN] = t.TRIANGLE_FAN)
            }
        }, {
            "../../const": 20,
            "../../utils": 74,
            "../SystemRenderer": 40,
            "./filters/FXAAFilter": 48,
            "./managers/BlendModeManager": 50,
            "./managers/FilterManager": 51,
            "./managers/MaskManager": 52,
            "./managers/ShaderManager": 53,
            "./managers/StencilManager": 54,
            "./utils/ObjectRenderer": 60,
            "./utils/RenderTarget": 62
        }],
        47: [function(t, e, r) {
            function i(t, e, r) {
                this.shaders = [], this.padding = 0, this.uniforms = r || {}, this.vertexSrc = t || n.defaultVertexSrc, this.fragmentSrc = e || n.defaultFragmentSrc
            }
            var n = t("../shaders/TextureShader");
            i.prototype.constructor = i, e.exports = i, i.prototype.getShader = function(t) {
                var e = t.gl,
                    r = this.shaders[e.id];
                return r || (r = new n(t.shaderManager, this.vertexSrc, this.fragmentSrc, this.uniforms, this.attributes), this.shaders[e.id] = r), r
            }, i.prototype.applyFilter = function(t, e, r, i) {
                var n = this.getShader(t);
                t.filterManager.applyFilter(n, e, r, i)
            }, i.prototype.syncUniform = function(t) {
                for (var e = 0, r = this.shaders.length; r > e; ++e) this.shaders[e].syncUniform(t)
            }
        }, {
            "../shaders/TextureShader": 59
        }],
        48: [function(t, e, r) {
            function i() {
                n.call(this, "\nprecision mediump float;\n\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform mat3 projectionMatrix;\nuniform vec2 resolution;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nvarying vec2 vResolution;\n\n//texcoords computed in vertex step\n//to avoid dependent texture reads\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\n\nvoid texcoords(vec2 fragCoord, vec2 resolution,\n            out vec2 v_rgbNW, out vec2 v_rgbNE,\n            out vec2 v_rgbSW, out vec2 v_rgbSE,\n            out vec2 v_rgbM) {\n    vec2 inverseVP = 1.0 / resolution.xy;\n    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;\n    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;\n    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;\n    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;\n    v_rgbM = vec2(fragCoord * inverseVP);\n}\n\nvoid main(void){\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n   vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n   vResolution = resolution;\n\n   //compute the texture coords and send them to varyings\n   texcoords(aTextureCoord * resolution, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n}\n", 'precision lowp float;\n\n\n/**\nBasic FXAA implementation based on the code on geeks3d.com with the\nmodification that the texture2DLod stuff was removed since it\'s\nunsupported by WebGL.\n\n--\n\nFrom:\nhttps://github.com/mitsuhiko/webgl-meincraft\n\nCopyright (c) 2011 by Armin Ronacher.\n\nSome rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are\nmet:\n\n    * Redistributions of source code must retain the above copyright\n      notice, this list of conditions and the following disclaimer.\n\n    * Redistributions in binary form must reproduce the above\n      copyright notice, this list of conditions and the following\n      disclaimer in the documentation and/or other materials provided\n      with the distribution.\n\n    * The names of the contributors may not be used to endorse or\n      promote products derived from this software without specific\n      prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\nLIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\nA PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\nOWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\nSPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\nLIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\nDATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\nTHEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n*/\n\n#ifndef FXAA_REDUCE_MIN\n    #define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#endif\n#ifndef FXAA_REDUCE_MUL\n    #define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#endif\n#ifndef FXAA_SPAN_MAX\n    #define FXAA_SPAN_MAX     8.0\n#endif\n\n//optimized version for mobile, where dependent\n//texture reads can be a bottleneck\nvec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution,\n            vec2 v_rgbNW, vec2 v_rgbNE,\n            vec2 v_rgbSW, vec2 v_rgbSE,\n            vec2 v_rgbM) {\n    vec4 color;\n    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n    vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;\n    vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;\n    vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;\n    vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;\n    vec4 texColor = texture2D(tex, v_rgbM);\n    vec3 rgbM  = texColor.xyz;\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\n    mediump vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\n    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n              dir * rcpDirMin)) * inverseVP;\n\n    vec3 rgbA = 0.5 * (\n        texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n        texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n\n    float lumaB = dot(rgbB, luma);\n    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n        color = vec4(rgbA, texColor.a);\n    else\n        color = vec4(rgbB, texColor.a);\n    return color;\n}\n\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying vec2 vResolution;\n\n//texcoords computed in vertex step\n//to avoid dependent texture reads\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nuniform sampler2D uSampler;\n\n\nvoid main(void){\n\n    gl_FragColor = fxaa(uSampler, vTextureCoord * vResolution, vResolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n\n}\n', {
                    resolution: {
                        type: "v2",
                        value: {
                            x: 1,
                            y: 1
                        }
                    }
                })
            }
            var n = t("./AbstractFilter");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager,
                    n = this.getShader(t);
                i.applyFilter(n, e, r)
            }
        }, {
            "./AbstractFilter": 47
        }],
        49: [function(t, e, r) {
            function i(t) {
                var e = new o.Matrix;
                n.call(this, "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n    vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n", "precision lowp float;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\nuniform float alpha;\nuniform sampler2D mask;\n\nvoid main(void)\n{\n    // check clip! this will stop the mask bleeding out from the edges\n    vec2 text = abs( vMaskCoord - 0.5 );\n    text = step(0.5, text);\n    float clip = 1.0 - max(text.y, text.x);\n    vec4 original = texture2D(uSampler, vTextureCoord);\n    vec4 masky = texture2D(mask, vMaskCoord);\n    original *= (masky.r * masky.a * alpha * clip);\n    gl_FragColor = original;\n}\n", {
                    mask: {
                        type: "sampler2D",
                        value: t._texture
                    },
                    alpha: {
                        type: "f",
                        value: 1
                    },
                    otherMatrix: {
                        type: "mat3",
                        value: e.toArray(!0)
                    }
                }), this.maskSprite = t, this.maskMatrix = e
            }
            var n = t("./AbstractFilter"),
                o = t("../../../math");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager;
                this.uniforms.mask.value = this.maskSprite._texture, i.calculateMappedMatrix(e.frame, this.maskSprite, this.maskMatrix), this.uniforms.otherMatrix.value = this.maskMatrix.toArray(!0), this.uniforms.alpha.value = this.maskSprite.worldAlpha;
                var n = this.getShader(t);
                i.applyFilter(n, e, r)
            }, Object.defineProperties(i.prototype, {
                map: {
                    get: function() {
                        return this.uniforms.mask.value
                    },
                    set: function(t) {
                        this.uniforms.mask.value = t
                    }
                },
                offset: {
                    get: function() {
                        return this.uniforms.offset.value
                    },
                    set: function(t) {
                        this.uniforms.offset.value = t
                    }
                }
            })
        }, {
            "../../../math": 30,
            "./AbstractFilter": 47
        }],
        50: [function(t, e, r) {
            function i(t) {
                n.call(this, t), this.currentBlendMode = 99999
            }
            var n = t("./WebGLManager");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.setBlendMode = function(t) {
                if (this.currentBlendMode === t) return !1;
                this.currentBlendMode = t;
                var e = this.renderer.blendModes[this.currentBlendMode];
                return this.renderer.gl.blendFunc(e[0], e[1]), !0
            }
        }, {
            "./WebGLManager": 55
        }],
        51: [function(t, e, r) {
            function i(t) {
                n.call(this, t), this.filterStack = [], this.filterStack.push({
                    renderTarget: t.currentRenderTarget,
                    filter: [],
                    bounds: null
                }), this.texturePool = [], this.textureSize = new h.Rectangle(0, 0, t.width, t.height), this.currentFrame = null
            }
            var n = t("./WebGLManager"),
                o = t("../utils/RenderTarget"),
                s = t("../../../const"),
                a = t("../utils/Quad"),
                h = t("../../../math");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.onContextChange = function() {
                this.texturePool.length = 0;
                var t = this.renderer.gl;
                this.quad = new a(t)
            }, i.prototype.setFilterStack = function(t) {
                this.filterStack = t
            }, i.prototype.pushFilter = function(t, e) {
                var r = t.filterArea ? t.filterArea.clone() : t.getBounds();
                r.x = 0 | r.x, r.y = 0 | r.y, r.width = 0 | r.width, r.height = 0 | r.height;
                var i = 0 | e[0].padding;
                if (r.x -= i, r.y -= i, r.width += 2 * i, r.height += 2 * i, this.renderer.currentRenderTarget.transform) {
                    var n = this.renderer.currentRenderTarget.transform;
                    r.x += n.tx, r.y += n.ty, this.capFilterArea(r), r.x -= n.tx, r.y -= n.ty
                } else this.capFilterArea(r);
                if (r.width > 0 && r.height > 0) {
                    this.currentFrame = r;
                    var o = this.getRenderTarget();
                    this.renderer.setRenderTarget(o), o.clear(), this.filterStack.push({
                        renderTarget: o,
                        filter: e
                    })
                } else this.filterStack.push({
                    renderTarget: null,
                    filter: e
                })
            }, i.prototype.popFilter = function() {
                var t = this.filterStack.pop(),
                    e = this.filterStack[this.filterStack.length - 1],
                    r = t.renderTarget;
                if (t.renderTarget) {
                    var i = e.renderTarget,
                        n = this.renderer.gl;
                    this.currentFrame = r.frame, this.quad.map(this.textureSize, r.frame), n.bindBuffer(n.ARRAY_BUFFER, this.quad.vertexBuffer), n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, this.quad.indexBuffer);
                    var o = t.filter;
                    if (n.vertexAttribPointer(this.renderer.shaderManager.defaultShader.attributes.aVertexPosition, 2, n.FLOAT, !1, 0, 0), n.vertexAttribPointer(this.renderer.shaderManager.defaultShader.attributes.aTextureCoord, 2, n.FLOAT, !1, 0, 32), n.vertexAttribPointer(this.renderer.shaderManager.defaultShader.attributes.aColor, 4, n.FLOAT, !1, 0, 64), this.renderer.blendModeManager.setBlendMode(s.BLEND_MODES.NORMAL), 1 === o.length) o[0].uniforms.dimensions && (o[0].uniforms.dimensions.value[0] = this.renderer.width, o[0].uniforms.dimensions.value[1] = this.renderer.height, o[0].uniforms.dimensions.value[2] = this.quad.vertices[0], o[0].uniforms.dimensions.value[3] = this.quad.vertices[5]), o[0].applyFilter(this.renderer, r, i), this.returnRenderTarget(r);
                    else {
                        for (var a = r, h = this.getRenderTarget(!0), u = 0; u < o.length - 1; u++) {
                            var l = o[u];
                            l.uniforms.dimensions && (l.uniforms.dimensions.value[0] = this.renderer.width, l.uniforms.dimensions.value[1] = this.renderer.height, l.uniforms.dimensions.value[2] = this.quad.vertices[0], l.uniforms.dimensions.value[3] = this.quad.vertices[5]), l.applyFilter(this.renderer, a, h);
                            var c = a;
                            a = h, h = c
                        }
                        o[o.length - 1].applyFilter(this.renderer, a, i), this.returnRenderTarget(a), this.returnRenderTarget(h)
                    }
                    return t.filter
                }
            }, i.prototype.getRenderTarget = function(t) {
                var e = this.texturePool.pop() || new o(this.renderer.gl, this.textureSize.width, this.textureSize.height, s.SCALE_MODES.LINEAR, this.renderer.resolution * s.FILTER_RESOLUTION);
                return e.frame = this.currentFrame, t && e.clear(!0), e
            }, i.prototype.returnRenderTarget = function(t) {
                this.texturePool.push(t)
            }, i.prototype.applyFilter = function(t, e, r, i) {
                var n = this.renderer.gl;
                this.renderer.setRenderTarget(r), i && r.clear(), this.renderer.shaderManager.setShader(t), t.uniforms.projectionMatrix.value = this.renderer.currentRenderTarget.projectionMatrix.toArray(!0), t.syncUniforms(), n.activeTexture(n.TEXTURE0), n.bindTexture(n.TEXTURE_2D, e.texture), n.drawElements(n.TRIANGLES, 6, n.UNSIGNED_SHORT, 0), this.renderer.drawCount++
            }, i.prototype.calculateMappedMatrix = function(t, e, r) {
                var i = e.worldTransform.copy(h.Matrix.TEMP_MATRIX),
                    n = e._texture.baseTexture,
                    o = r.identity(),
                    s = this.textureSize.height / this.textureSize.width;
                o.translate(t.x / this.textureSize.width, t.y / this.textureSize.height), o.scale(1, s);
                var a = this.textureSize.width / n.width,
                    u = this.textureSize.height / n.height;
                return i.tx /= n.width * a, i.ty /= n.width * a, i.invert(), o.prepend(i), o.scale(1, 1 / s), o.scale(a, u), o.translate(e.anchor.x, e.anchor.y), o
            }, i.prototype.capFilterArea = function(t) {
                t.x < 0 && (t.width += t.x, t.x = 0), t.y < 0 && (t.height += t.y, t.y = 0), t.x + t.width > this.textureSize.width && (t.width = this.textureSize.width - t.x), t.y + t.height > this.textureSize.height && (t.height = this.textureSize.height - t.y)
            }, i.prototype.resize = function(t, e) {
                this.textureSize.width = t, this.textureSize.height = e;
                for (var r = 0; r < this.texturePool.length; r++) this.texturePool[r].resize(t, e)
            }, i.prototype.destroy = function() {
                this.quad.destroy(), n.prototype.destroy.call(this), this.filterStack = null, this.offsetY = 0;
                for (var t = 0; t < this.texturePool.length; t++) this.texturePool[t].destroy();
                this.texturePool = null
            }
        }, {
            "../../../const": 20,
            "../../../math": 30,
            "../utils/Quad": 61,
            "../utils/RenderTarget": 62,
            "./WebGLManager": 55
        }],
        52: [function(t, e, r) {
            function i(t) {
                n.call(this, t), this.stencilStack = [], this.reverse = !0, this.count = 0, this.alphaMaskPool = []
            }
            var n = t("./WebGLManager"),
                o = t("../filters/SpriteMaskFilter");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.pushMask = function(t, e) {
                e.texture ? this.pushSpriteMask(t, e) : this.pushStencilMask(t, e)
            }, i.prototype.popMask = function(t, e) {
                e.texture ? this.popSpriteMask(t, e) : this.popStencilMask(t, e)
            }, i.prototype.pushSpriteMask = function(t, e) {
                var r = this.alphaMaskPool.pop();
                r || (r = [new o(e)]), r[0].maskSprite = e, this.renderer.filterManager.pushFilter(t, r)
            }, i.prototype.popSpriteMask = function() {
                var t = this.renderer.filterManager.popFilter();
                this.alphaMaskPool.push(t)
            }, i.prototype.pushStencilMask = function(t, e) {
                this.renderer.stencilManager.pushMask(e)
            }, i.prototype.popStencilMask = function(t, e) {
                this.renderer.stencilManager.popMask(e)
            }
        }, {
            "../filters/SpriteMaskFilter": 49,
            "./WebGLManager": 55
        }],
        53: [function(t, e, r) {
            function i(t) {
                n.call(this, t), this.maxAttibs = 10, this.attribState = [], this.tempAttribState = [];
                for (var e = 0; e < this.maxAttibs; e++) this.attribState[e] = !1;
                this.stack = [], this._currentId = -1, this.currentShader = null
            }
            var n = t("./WebGLManager"),
                o = t("../shaders/TextureShader"),
                s = t("../shaders/ComplexPrimitiveShader"),
                a = t("../shaders/PrimitiveShader"),
                h = t("../../../utils");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, h.pluginTarget.mixin(i), e.exports = i, i.prototype.onContextChange = function() {
                this.initPlugins();
                var t = this.renderer.gl;
                this.maxAttibs = t.getParameter(t.MAX_VERTEX_ATTRIBS), this.attribState = [];
                for (var e = 0; e < this.maxAttibs; e++) this.attribState[e] = !1;
                this.defaultShader = new o(this), this.primitiveShader = new a(this), this.complexPrimitiveShader = new s(this)
            }, i.prototype.setAttribs = function(t) {
                var e;
                for (e = 0; e < this.tempAttribState.length; e++) this.tempAttribState[e] = !1;
                for (var r in t) this.tempAttribState[t[r]] = !0;
                var i = this.renderer.gl;
                for (e = 0; e < this.attribState.length; e++) this.attribState[e] !== this.tempAttribState[e] && (this.attribState[e] = this.tempAttribState[e], this.attribState[e] ? i.enableVertexAttribArray(e) : i.disableVertexAttribArray(e))
            }, i.prototype.setShader = function(t) {
                return this._currentId === t.uid ? !1 : (this._currentId = t.uid, this.currentShader = t, this.renderer.gl.useProgram(t.program), this.setAttribs(t.attributes), !0)
            }, i.prototype.destroy = function() {
                this.primitiveShader.destroy(), this.complexPrimitiveShader.destroy(), n.prototype.destroy.call(this), this.destroyPlugins(), this.attribState = null, this.tempAttribState = null
            }
        }, {
            "../../../utils": 74,
            "../shaders/ComplexPrimitiveShader": 56,
            "../shaders/PrimitiveShader": 57,
            "../shaders/TextureShader": 59,
            "./WebGLManager": 55
        }],
        54: [function(t, e, r) {
            function i(t) {
                n.call(this, t), this.stencilMaskStack = null
            }
            var n = t("./WebGLManager"),
                o = t("../../../utils");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.setMaskStack = function(t) {
                this.stencilMaskStack = t;
                var e = this.renderer.gl;
                0 === t.stencilStack.length ? e.disable(e.STENCIL_TEST) : e.enable(e.STENCIL_TEST)
            }, i.prototype.pushStencil = function(t, e) {
                this.renderer.currentRenderTarget.attachStencilBuffer();
                var r = this.renderer.gl,
                    i = this.stencilMaskStack;
                this.bindGraphics(t, e), 0 === i.stencilStack.length && (r.enable(r.STENCIL_TEST), r.clear(r.STENCIL_BUFFER_BIT), i.reverse = !0, i.count = 0), i.stencilStack.push(e);
                var n = i.count;
                r.colorMask(!1, !1, !1, !1), r.stencilFunc(r.ALWAYS, 0, 255), r.stencilOp(r.KEEP, r.KEEP, r.INVERT), 1 === e.mode ? (r.drawElements(r.TRIANGLE_FAN, e.indices.length - 4, r.UNSIGNED_SHORT, 0), i.reverse ? (r.stencilFunc(r.EQUAL, 255 - n, 255), r.stencilOp(r.KEEP, r.KEEP, r.DECR)) : (r.stencilFunc(r.EQUAL, n, 255), r.stencilOp(r.KEEP, r.KEEP, r.INCR)), r.drawElements(r.TRIANGLE_FAN, 4, r.UNSIGNED_SHORT, 2 * (e.indices.length - 4)), i.reverse ? r.stencilFunc(r.EQUAL, 255 - (n + 1), 255) : r.stencilFunc(r.EQUAL, n + 1, 255), i.reverse = !i.reverse) : (i.reverse ? (r.stencilFunc(r.EQUAL, n, 255), r.stencilOp(r.KEEP, r.KEEP, r.INCR)) : (r.stencilFunc(r.EQUAL, 255 - n, 255), r.stencilOp(r.KEEP, r.KEEP, r.DECR)), r.drawElements(r.TRIANGLE_STRIP, e.indices.length, r.UNSIGNED_SHORT, 0), i.reverse ? r.stencilFunc(r.EQUAL, n + 1, 255) : r.stencilFunc(r.EQUAL, 255 - (n + 1), 255)), r.colorMask(!0, !0, !0, !0), r.stencilOp(r.KEEP, r.KEEP, r.KEEP), i.count++
            }, i.prototype.bindGraphics = function(t, e) {
                var r, i = this.renderer.gl;
                1 === e.mode ? (r = this.renderer.shaderManager.complexPrimitiveShader, this.renderer.shaderManager.setShader(r), i.uniformMatrix3fv(r.uniforms.translationMatrix._location, !1, t.worldTransform.toArray(!0)), i.uniformMatrix3fv(r.uniforms.projectionMatrix._location, !1, this.renderer.currentRenderTarget.projectionMatrix.toArray(!0)), i.uniform3fv(r.uniforms.tint._location, o.hex2rgb(t.tint)), i.uniform3fv(r.uniforms.color._location, e.color), i.uniform1f(r.uniforms.alpha._location, t.worldAlpha), i.bindBuffer(i.ARRAY_BUFFER, e.buffer), i.vertexAttribPointer(r.attributes.aVertexPosition, 2, i.FLOAT, !1, 8, 0), i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, e.indexBuffer)) : (r = this.renderer.shaderManager.primitiveShader, this.renderer.shaderManager.setShader(r), i.uniformMatrix3fv(r.uniforms.translationMatrix._location, !1, t.worldTransform.toArray(!0)), i.uniformMatrix3fv(r.uniforms.projectionMatrix._location, !1, this.renderer.currentRenderTarget.projectionMatrix.toArray(!0)), i.uniform3fv(r.uniforms.tint._location, o.hex2rgb(t.tint)), i.uniform1f(r.uniforms.alpha._location, t.worldAlpha), i.bindBuffer(i.ARRAY_BUFFER, e.buffer), i.vertexAttribPointer(r.attributes.aVertexPosition, 2, i.FLOAT, !1, 24, 0), i.vertexAttribPointer(r.attributes.aColor, 4, i.FLOAT, !1, 24, 8), i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, e.indexBuffer))
            }, i.prototype.popStencil = function(t, e) {
                var r = this.renderer.gl,
                    i = this.stencilMaskStack;
                if (i.stencilStack.pop(), i.count--, 0 === i.stencilStack.length) r.disable(r.STENCIL_TEST);
                else {
                    var n = i.count;
                    this.bindGraphics(t, e), r.colorMask(!1, !1, !1, !1), 1 === e.mode ? (i.reverse = !i.reverse, i.reverse ? (r.stencilFunc(r.EQUAL, 255 - (n + 1), 255), r.stencilOp(r.KEEP, r.KEEP, r.INCR)) : (r.stencilFunc(r.EQUAL, n + 1, 255), r.stencilOp(r.KEEP, r.KEEP, r.DECR)), r.drawElements(r.TRIANGLE_FAN, 4, r.UNSIGNED_SHORT, 2 * (e.indices.length - 4)), r.stencilFunc(r.ALWAYS, 0, 255), r.stencilOp(r.KEEP, r.KEEP, r.INVERT), r.drawElements(r.TRIANGLE_FAN, e.indices.length - 4, r.UNSIGNED_SHORT, 0), this.renderer.drawCount += 2, i.reverse ? r.stencilFunc(r.EQUAL, n, 255) : r.stencilFunc(r.EQUAL, 255 - n, 255)) : (i.reverse ? (r.stencilFunc(r.EQUAL, n + 1, 255), r.stencilOp(r.KEEP, r.KEEP, r.DECR)) : (r.stencilFunc(r.EQUAL, 255 - (n + 1), 255), r.stencilOp(r.KEEP, r.KEEP, r.INCR)), r.drawElements(r.TRIANGLE_STRIP, e.indices.length, r.UNSIGNED_SHORT, 0), this.renderer.drawCount++, i.reverse ? r.stencilFunc(r.EQUAL, n, 255) : r.stencilFunc(r.EQUAL, 255 - n, 255)), r.colorMask(!0, !0, !0, !0), r.stencilOp(r.KEEP, r.KEEP, r.KEEP)
                }
            }, i.prototype.destroy = function() {
                n.prototype.destroy.call(this), this.stencilMaskStack.stencilStack = null
            }, i.prototype.pushMask = function(t) {
                this.renderer.setObjectRenderer(this.renderer.plugins.graphics), t.dirty && this.renderer.plugins.graphics.updateGraphics(t, this.renderer.gl), t._webGL[this.renderer.gl.id].data.length && this.pushStencil(t, t._webGL[this.renderer.gl.id].data[0])
            }, i.prototype.popMask = function(t) {
                this.renderer.setObjectRenderer(this.renderer.plugins.graphics), this.popStencil(t, t._webGL[this.renderer.gl.id].data[0])
            }
        }, {
            "../../../utils": 74,
            "./WebGLManager": 55
        }],
        55: [function(t, e, r) {
            function i(t) {
                this.renderer = t, this.renderer.on("context", this.onContextChange, this)
            }
            i.prototype.constructor = i, e.exports = i, i.prototype.onContextChange = function() {}, i.prototype.destroy = function() {
                this.renderer.off("context", this.onContextChange, this), this.renderer = null
            }
        }, {}],
        56: [function(t, e, r) {
            function i(t) {
                n.call(this, t, ["attribute vec2 aVertexPosition;", "uniform mat3 translationMatrix;", "uniform mat3 projectionMatrix;", "uniform vec3 tint;", "uniform float alpha;", "uniform vec3 color;", "varying vec4 vColor;", "void main(void){", "   gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);", "   vColor = vec4(color * alpha * tint, alpha);", "}"].join("\n"), ["precision mediump float;", "varying vec4 vColor;", "void main(void){", "   gl_FragColor = vColor;", "}"].join("\n"), {
                    tint: {
                        type: "3f",
                        value: [0, 0, 0]
                    },
                    alpha: {
                        type: "1f",
                        value: 0
                    },
                    color: {
                        type: "3f",
                        value: [0, 0, 0]
                    },
                    translationMatrix: {
                        type: "mat3",
                        value: new Float32Array(9)
                    },
                    projectionMatrix: {
                        type: "mat3",
                        value: new Float32Array(9)
                    }
                }, {
                    aVertexPosition: 0
                })
            }
            var n = t("./Shader");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i
        }, {
            "./Shader": 58
        }],
        57: [function(t, e, r) {
            function i(t) {
                n.call(this, t, ["attribute vec2 aVertexPosition;", "attribute vec4 aColor;", "uniform mat3 translationMatrix;", "uniform mat3 projectionMatrix;", "uniform float alpha;", "uniform float flipY;", "uniform vec3 tint;", "varying vec4 vColor;", "void main(void){", "   gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);", "   vColor = aColor * vec4(tint * alpha, alpha);", "}"].join("\n"), ["precision mediump float;", "varying vec4 vColor;", "void main(void){", "   gl_FragColor = vColor;", "}"].join("\n"), {
                    tint: {
                        type: "3f",
                        value: [0, 0, 0]
                    },
                    alpha: {
                        type: "1f",
                        value: 0
                    },
                    translationMatrix: {
                        type: "mat3",
                        value: new Float32Array(9)
                    },
                    projectionMatrix: {
                        type: "mat3",
                        value: new Float32Array(9)
                    }
                }, {
                    aVertexPosition: 0,
                    aColor: 0
                })
            }
            var n = t("./Shader");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i
        }, {
            "./Shader": 58
        }],
        58: [function(t, e, r) {
            function i(t, e, r, i, o) {
                if (!e || !r) throw new Error("Pixi.js Error. Shader requires vertexSrc and fragmentSrc");
                this.uid = n.uid(), this.gl = t.renderer.gl, this.shaderManager = t, this.program = null, this.uniforms = i || {}, this.attributes = o || {}, this.textureCount = 1, this.vertexSrc = e, this.fragmentSrc = r, this.init()
            }
            var n = t("../../../utils");
            i.prototype.constructor = i, e.exports = i, i.prototype.init = function() {
                this.compile(), this.gl.useProgram(this.program), this.cacheUniformLocations(Object.keys(this.uniforms)), this.cacheAttributeLocations(Object.keys(this.attributes))
            }, i.prototype.cacheUniformLocations = function(t) {
                for (var e = 0; e < t.length; ++e) this.uniforms[t[e]]._location = this.gl.getUniformLocation(this.program, t[e])
            }, i.prototype.cacheAttributeLocations = function(t) {
                for (var e = 0; e < t.length; ++e) this.attributes[t[e]] = this.gl.getAttribLocation(this.program, t[e])
            }, i.prototype.compile = function() {
                var t = this.gl,
                    e = this._glCompile(t.VERTEX_SHADER, this.vertexSrc),
                    r = this._glCompile(t.FRAGMENT_SHADER, this.fragmentSrc),
                    i = t.createProgram();
                return t.attachShader(i, e), t.attachShader(i, r), t.linkProgram(i), t.getProgramParameter(i, t.LINK_STATUS) || (console.error("Pixi.js Error: Could not initialize shader."), console.error("gl.VALIDATE_STATUS", t.getProgramParameter(i, t.VALIDATE_STATUS)), console.error("gl.getError()", t.getError()), "" !== t.getProgramInfoLog(i) && console.warn("Pixi.js Warning: gl.getProgramInfoLog()", t.getProgramInfoLog(i)), t.deleteProgram(i), i = null), t.deleteShader(e), t.deleteShader(r), this.program = i
            }, i.prototype.syncUniform = function(t) {
                var e, r, i = t._location,
                    o = t.value,
                    s = this.gl;
                switch (t.type) {
                    case "b":
                    case "bool":
                    case "boolean":
                        s.uniform1i(i, o ? 1 : 0);
                        break;
                    case "i":
                    case "1i":
                        s.uniform1i(i, o);
                        break;
                    case "f":
                    case "1f":
                        s.uniform1f(i, o);
                        break;
                    case "2f":
                        s.uniform2f(i, o[0], o[1]);
                        break;
                    case "3f":
                        s.uniform3f(i, o[0], o[1], o[2]);
                        break;
                    case "4f":
                        s.uniform4f(i, o[0], o[1], o[2], o[3]);
                        break;
                    case "v2":
                        s.uniform2f(i, o.x, o.y);
                        break;
                    case "v3":
                        s.uniform3f(i, o.x, o.y, o.z);
                        break;
                    case "v4":
                        s.uniform4f(i, o.x, o.y, o.z, o.w);
                        break;
                    case "1iv":
                        s.uniform1iv(i, o);
                        break;
                    case "2iv":
                        s.uniform2iv(i, o);
                        break;
                    case "3iv":
                        s.uniform3iv(i, o);
                        break;
                    case "4iv":
                        s.uniform4iv(i, o);
                        break;
                    case "1fv":
                        s.uniform1fv(i, o);
                        break;
                    case "2fv":
                        s.uniform2fv(i, o);
                        break;
                    case "3fv":
                        s.uniform3fv(i, o);
                        break;
                    case "4fv":
                        s.uniform4fv(i, o);
                        break;
                    case "m2":
                    case "mat2":
                    case "Matrix2fv":
                        s.uniformMatrix2fv(i, t.transpose, o);
                        break;
                    case "m3":
                    case "mat3":
                    case "Matrix3fv":
                        s.uniformMatrix3fv(i, t.transpose, o);
                        break;
                    case "m4":
                    case "mat4":
                    case "Matrix4fv":
                        s.uniformMatrix4fv(i, t.transpose, o);
                        break;
                    case "c":
                        "number" == typeof o && (o = n.hex2rgb(o)), s.uniform3f(i, o[0], o[1], o[2]);
                        break;
                    case "iv1":
                        s.uniform1iv(i, o);
                        break;
                    case "iv":
                        s.uniform3iv(i, o);
                        break;
                    case "fv1":
                        s.uniform1fv(i, o);
                        break;
                    case "fv":
                        s.uniform3fv(i, o);
                        break;
                    case "v2v":
                        for (t._array || (t._array = new Float32Array(2 * o.length)), e = 0, r = o.length; r > e; ++e) t._array[2 * e] = o[e].x, t._array[2 * e + 1] = o[e].y;
                        s.uniform2fv(i, t._array);
                        break;
                    case "v3v":
                        for (t._array || (t._array = new Float32Array(3 * o.length)), e = 0, r = o.length; r > e; ++e) t._array[3 * e] = o[e].x, t._array[3 * e + 1] = o[e].y, t._array[3 * e + 2] = o[e].z;
                        s.uniform3fv(i, t._array);
                        break;
                    case "v4v":
                        for (t._array || (t._array = new Float32Array(4 * o.length)), e = 0, r = o.length; r > e; ++e) t._array[4 * e] = o[e].x, t._array[4 * e + 1] = o[e].y, t._array[4 * e + 2] = o[e].z, t._array[4 * e + 3] = o[e].w;
                        s.uniform4fv(i, t._array);
                        break;
                    case "t":
                    case "sampler2D":
                        if (!t.value || !t.value.baseTexture.hasLoaded) break;
                        s.activeTexture(s["TEXTURE" + this.textureCount]);
                        var a = t.value.baseTexture._glTextures[s.id];
                        a || (this.initSampler2D(t), a = t.value.baseTexture._glTextures[s.id]), s.bindTexture(s.TEXTURE_2D, a), s.uniform1i(t._location, this.textureCount), this.textureCount++;
                        break;
                    default:
                        console.warn("Pixi.js Shader Warning: Unknown uniform type: " + t.type)
                }
            }, i.prototype.syncUniforms = function() {
                this.textureCount = 1;
                for (var t in this.uniforms) this.syncUniform(this.uniforms[t])
            }, i.prototype.initSampler2D = function(t) {
                var e = this.gl,
                    r = t.value.baseTexture;
                if (r.hasLoaded)
                    if (t.textureData) {
                        var i = t.textureData;
                        r._glTextures[e.id] = e.createTexture(), e.bindTexture(e.TEXTURE_2D, r._glTextures[e.id]), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, r.premultipliedAlpha), e.texImage2D(e.TEXTURE_2D, 0, i.luminance ? e.LUMINANCE : e.RGBA, e.RGBA, e.UNSIGNED_BYTE, r.source), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, i.magFilter ? i.magFilter : e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, i.wrapS ? i.wrapS : e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, i.wrapS ? i.wrapS : e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, i.wrapT ? i.wrapT : e.CLAMP_TO_EDGE)
                    } else this.shaderManager.renderer.updateTexture(r)
            }, i.prototype.destroy = function() {
                this.gl.deleteProgram(this.program), this.gl = null, this.uniforms = null, this.attributes = null, this.vertexSrc = null, this.fragmentSrc = null
            }, i.prototype._glCompile = function(t, e) {
                var r = this.gl.createShader(t);
                return this.gl.shaderSource(r, e), this.gl.compileShader(r), this.gl.getShaderParameter(r, this.gl.COMPILE_STATUS) ? r : (console.log(this.gl.getShaderInfoLog(r)), null)
            }
        }, {
            "../../../utils": 74
        }],
        59: [function(t, e, r) {
            function i(t, e, r, o, s) {
                var a = {
                    uSampler: {
                        type: "sampler2D",
                        value: 0
                    },
                    projectionMatrix: {
                        type: "mat3",
                        value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
                    }
                };
                if (o)
                    for (var h in o) a[h] = o[h];
                var u = {
                    aVertexPosition: 0,
                    aTextureCoord: 0,
                    aColor: 0
                };
                if (s)
                    for (var l in s) u[l] = s[l];
                e = e || i.defaultVertexSrc, r = r || i.defaultFragmentSrc, n.call(this, t, e, r, a, u)
            }
            var n = t("./Shader");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.defaultVertexSrc = ["precision lowp float;", "attribute vec2 aVertexPosition;", "attribute vec2 aTextureCoord;", "attribute vec4 aColor;", "uniform mat3 projectionMatrix;", "varying vec2 vTextureCoord;", "varying vec4 vColor;", "void main(void){", "   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);", "   vTextureCoord = aTextureCoord;", "   vColor = vec4(aColor.rgb * aColor.a, aColor.a);", "}"].join("\n"), i.defaultFragmentSrc = ["precision lowp float;", "varying vec2 vTextureCoord;", "varying vec4 vColor;", "uniform sampler2D uSampler;", "void main(void){", "   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;", "}"].join("\n")
        }, {
            "./Shader": 58
        }],
        60: [function(t, e, r) {
            function i(t) {
                n.call(this, t)
            }
            var n = t("../managers/WebGLManager");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.start = function() {}, i.prototype.stop = function() {
                this.flush()
            }, i.prototype.flush = function() {}, i.prototype.render = function(t) {}
        }, {
            "../managers/WebGLManager": 55
        }],
        61: [function(t, e, r) {
            function i(t) {
                this.gl = t, this.vertices = new Float32Array([0, 0, 200, 0, 200, 200, 0, 200]), this.uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), this.colors = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), this.indices = new Uint16Array([0, 1, 2, 0, 3, 2]), this.vertexBuffer = t.createBuffer(), this.indexBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.vertexBuffer), t.bufferData(t.ARRAY_BUFFER, 128, t.DYNAMIC_DRAW), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indexBuffer), t.bufferData(t.ELEMENT_ARRAY_BUFFER, this.indices, t.STATIC_DRAW), this.upload()
            }
            i.prototype.constructor = i, i.prototype.map = function(t, e) {
                var r = 0,
                    i = 0;
                this.uvs[0] = r, this.uvs[1] = i, this.uvs[2] = r + e.width / t.width, this.uvs[3] = i, this.uvs[4] = r + e.width / t.width, this.uvs[5] = i + e.height / t.height, this.uvs[6] = r, this.uvs[7] = i + e.height / t.height, r = e.x, i = e.y, this.vertices[0] = r, this.vertices[1] = i, this.vertices[2] = r + e.width, this.vertices[3] = i, this.vertices[4] = r + e.width, this.vertices[5] = i + e.height, this.vertices[6] = r, this.vertices[7] = i + e.height, this.upload()
            }, i.prototype.upload = function() {
                var t = this.gl;
                t.bindBuffer(t.ARRAY_BUFFER, this.vertexBuffer), t.bufferSubData(t.ARRAY_BUFFER, 0, this.vertices), t.bufferSubData(t.ARRAY_BUFFER, 32, this.uvs), t.bufferSubData(t.ARRAY_BUFFER, 64, this.colors)
            }, i.prototype.destroy = function() {
                var t = this.gl;
                t.deleteBuffer(this.vertexBuffer), t.deleteBuffer(this.indexBuffer)
            }, e.exports = i
        }, {}],
        62: [function(t, e, r) {
            var i = t("../../../math"),
                n = t("../../../utils"),
                o = t("../../../const"),
                s = t("./StencilMaskStack"),
                a = function(t, e, r, a, h, u) {
                    if (this.gl = t, this.frameBuffer = null, this.texture = null, this.size = new i.Rectangle(0, 0, 1, 1), this.resolution = h || o.RESOLUTION, this.projectionMatrix = new i.Matrix, this.transform = null, this.frame = null, this.stencilBuffer = null, this.stencilMaskStack = new s, this.filterStack = [{
                            renderTarget: this,
                            filter: [],
                            bounds: this.size
                        }], this.scaleMode = a || o.SCALE_MODES.DEFAULT, this.root = u, !this.root) {
                        this.frameBuffer = t.createFramebuffer(), this.texture = t.createTexture(), t.bindTexture(t.TEXTURE_2D, this.texture), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, a === o.SCALE_MODES.LINEAR ? t.LINEAR : t.NEAREST), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, a === o.SCALE_MODES.LINEAR ? t.LINEAR : t.NEAREST);
                        var l = n.isPowerOfTwo(e, r);
                        l ? (t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.REPEAT), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.REPEAT)) : (t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE)), t.bindFramebuffer(t.FRAMEBUFFER, this.frameBuffer), t.framebufferTexture2D(t.FRAMEBUFFER, t.COLOR_ATTACHMENT0, t.TEXTURE_2D, this.texture, 0)
                    }
                    this.resize(e, r)
                };
            a.prototype.constructor = a, e.exports = a, a.prototype.clear = function(t) {
                var e = this.gl;
                t && e.bindFramebuffer(e.FRAMEBUFFER, this.frameBuffer), e.clearColor(0, 0, 0, 0), e.clear(e.COLOR_BUFFER_BIT)
            }, a.prototype.attachStencilBuffer = function() {
                if (!this.stencilBuffer && !this.root) {
                    var t = this.gl;
                    this.stencilBuffer = t.createRenderbuffer(), t.bindRenderbuffer(t.RENDERBUFFER, this.stencilBuffer), t.framebufferRenderbuffer(t.FRAMEBUFFER, t.DEPTH_STENCIL_ATTACHMENT, t.RENDERBUFFER, this.stencilBuffer), t.renderbufferStorage(t.RENDERBUFFER, t.DEPTH_STENCIL, this.size.width * this.resolution, this.size.height * this.resolution)
                }
            }, a.prototype.activate = function() {
                var t = this.gl;
                t.bindFramebuffer(t.FRAMEBUFFER, this.frameBuffer);
                var e = this.frame || this.size;
                this.calculateProjection(e), this.transform && this.projectionMatrix.append(this.transform), t.viewport(0, 0, e.width * this.resolution, e.height * this.resolution)
            }, a.prototype.calculateProjection = function(t) {
                var e = this.projectionMatrix;
                e.identity(), this.root ? (e.a = 1 / t.width * 2, e.d = -1 / t.height * 2, e.tx = -1 - t.x * e.a, e.ty = 1 - t.y * e.d) : (e.a = 1 / t.width * 2, e.d = 1 / t.height * 2, e.tx = -1 - t.x * e.a, e.ty = -1 - t.y * e.d)
            }, a.prototype.resize = function(t, e) {
                if (t = 0 | t, e = 0 | e, this.size.width !== t || this.size.height !== e) {
                    if (this.size.width = t, this.size.height = e, !this.root) {
                        var r = this.gl;
                        r.bindTexture(r.TEXTURE_2D, this.texture), r.texImage2D(r.TEXTURE_2D, 0, r.RGBA, t * this.resolution, e * this.resolution, 0, r.RGBA, r.UNSIGNED_BYTE, null), this.stencilBuffer && (r.bindRenderbuffer(r.RENDERBUFFER, this.stencilBuffer), r.renderbufferStorage(r.RENDERBUFFER, r.DEPTH_STENCIL, t * this.resolution, e * this.resolution))
                    }
                    var i = this.frame || this.size;
                    this.calculateProjection(i)
                }
            }, a.prototype.destroy = function() {
                var t = this.gl;
                t.deleteRenderbuffer(this.stencilBuffer), t.deleteFramebuffer(this.frameBuffer), t.deleteTexture(this.texture), this.frameBuffer = null, this.texture = null
            }
        }, {
            "../../../const": 20,
            "../../../math": 30,
            "../../../utils": 74,
            "./StencilMaskStack": 63
        }],
        63: [function(t, e, r) {
            function i() {
                this.stencilStack = [], this.reverse = !0, this.count = 0
            }
            i.prototype.constructor = i, e.exports = i
        }, {}],
        64: [function(t, e, r) {
            function i(t) {
                s.call(this), this.anchor = new n.Point, this._texture = null, this._width = 0, this._height = 0, this.tint = 16777215, this.blendMode = u.BLEND_MODES.NORMAL, this.shader = null, this.cachedTint = 16777215, this.texture = t || o.EMPTY
            }
            var n = t("../math"),
                o = t("../textures/Texture"),
                s = t("../display/Container"),
                a = t("../renderers/canvas/utils/CanvasTinter"),
                h = t("../utils"),
                u = t("../const"),
                l = new n.Point;
            i.prototype = Object.create(s.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                width: {
                    get: function() {
                        return Math.abs(this.scale.x) * this.texture._frame.width
                    },
                    set: function(t) {
                        this.scale.x = h.sign(this.scale.x) * t / this.texture._frame.width, this._width = t
                    }
                },
                height: {
                    get: function() {
                        return Math.abs(this.scale.y) * this.texture._frame.height
                    },
                    set: function(t) {
                        this.scale.y = h.sign(this.scale.y) * t / this.texture._frame.height, this._height = t
                    }
                },
                texture: {
                    get: function() {
                        return this._texture
                    },
                    set: function(t) {
                        this._texture !== t && (this._texture = t, this.cachedTint = 16777215, t && (t.baseTexture.hasLoaded ? this._onTextureUpdate() : t.once("update", this._onTextureUpdate, this)))
                    }
                }
            }), i.prototype._onTextureUpdate = function() {
                this._width && (this.scale.x = h.sign(this.scale.x) * this._width / this.texture.frame.width), this._height && (this.scale.y = h.sign(this.scale.y) * this._height / this.texture.frame.height)
            }, i.prototype._renderWebGL = function(t) {
                t.setObjectRenderer(t.plugins.sprite), t.plugins.sprite.render(this)
            }, i.prototype.getBounds = function(t) {
                if (!this._currentBounds) {
                    var e, r, i, n, o = this._texture._frame.width,
                        s = this._texture._frame.height,
                        a = o * (1 - this.anchor.x),
                        h = o * -this.anchor.x,
                        u = s * (1 - this.anchor.y),
                        l = s * -this.anchor.y,
                        c = t || this.worldTransform,
                        p = c.a,
                        d = c.b,
                        f = c.c,
                        v = c.d,
                        g = c.tx,
                        m = c.ty;
                    if (0 === d && 0 === f) 0 > p && (p *= -1), 0 > v && (v *= -1), e = p * h + g, r = p * a + g, i = v * l + m, n = v * u + m;
                    else {
                        var y = p * h + f * l + g,
                            x = v * l + d * h + m,
                            b = p * a + f * l + g,
                            _ = v * l + d * a + m,
                            T = p * a + f * u + g,
                            E = v * u + d * a + m,
                            S = p * h + f * u + g,
                            w = v * u + d * h + m;
                        e = y, e = e > b ? b : e, e = e > T ? T : e, e = e > S ? S : e, i = x, i = i > _ ? _ : i, i = i > E ? E : i, i = i > w ? w : i, r = y, r = b > r ? b : r, r = T > r ? T : r, r = S > r ? S : r, n = x, n = _ > n ? _ : n, n = E > n ? E : n, n = w > n ? w : n
                    }
                    if (this.children.length) {
                        var A = this.containerGetBounds();
                        a = A.x, h = A.x + A.width, u = A.y, l = A.y + A.height, e = a > e ? e : a, i = u > i ? i : u, r = r > h ? r : h, n = n > l ? n : l
                    }
                    var C = this._bounds;
                    C.x = e, C.width = r - e, C.y = i, C.height = n - i, this._currentBounds = C
                }
                return this._currentBounds
            }, i.prototype.getLocalBounds = function() {
                return this._bounds.x = -this._texture._frame.width * this.anchor.x, this._bounds.y = -this._texture._frame.height * this.anchor.y, this._bounds.width = this._texture._frame.width, this._bounds.height = this._texture._frame.height, this._bounds
            }, i.prototype.containsPoint = function(t) {
                this.worldTransform.applyInverse(t, l);
                var e, r = this._texture._frame.width,
                    i = this._texture._frame.height,
                    n = -r * this.anchor.x;
                return l.x > n && l.x < n + r && (e = -i * this.anchor.y, l.y > e && l.y < e + i) ? !0 : !1
            }, i.prototype._renderCanvas = function(t) {
                if (!(this.texture.crop.width <= 0 || this.texture.crop.height <= 0)) {
                    var e = t.blendModes[this.blendMode];
                    if (e !== t.context.globalCompositeOperation && (t.context.globalCompositeOperation = e), this.texture.valid) {
                        var r, i, n, o, s = this._texture,
                            h = this.worldTransform;
                        t.context.globalAlpha = this.worldAlpha;
                        var l = s.baseTexture.scaleMode === u.SCALE_MODES.LINEAR;
                        if (t.smoothProperty && t.context[t.smoothProperty] !== l && (t.context[t.smoothProperty] = l), s.rotate) {
                            var c = h.a,
                                p = h.b;
                            h.a = -h.c, h.b = -h.d, h.c = c, h.d = p, n = s.crop.height, o = s.crop.width, r = s.trim ? s.trim.y - this.anchor.y * s.trim.height : this.anchor.y * -s._frame.height, i = s.trim ? s.trim.x - this.anchor.x * s.trim.width : this.anchor.x * -s._frame.width
                        } else n = s.crop.width, o = s.crop.height, r = s.trim ? s.trim.x - this.anchor.x * s.trim.width : this.anchor.x * -s._frame.width, i = s.trim ? s.trim.y - this.anchor.y * s.trim.height : this.anchor.y * -s._frame.height;
                        t.roundPixels ? (t.context.setTransform(h.a, h.b, h.c, h.d, h.tx * t.resolution | 0, h.ty * t.resolution | 0), r = 0 | r, i = 0 | i) : t.context.setTransform(h.a, h.b, h.c, h.d, h.tx * t.resolution, h.ty * t.resolution);
                        var d = s.baseTexture.resolution;
                        16777215 !== this.tint ? (this.cachedTint !== this.tint && (this.cachedTint = this.tint, this.tintedTexture = a.getTintedTexture(this, this.tint)), t.context.drawImage(this.tintedTexture, 0, 0, n * d, o * d, r * t.resolution, i * t.resolution, n * t.resolution, o * t.resolution)) : t.context.drawImage(s.baseTexture.source, s.crop.x * d, s.crop.y * d, n * d, o * d, r * t.resolution, i * t.resolution, n * t.resolution, o * t.resolution)
                    }
                }
            }, i.prototype.destroy = function(t, e) {
                s.prototype.destroy.call(this), this.anchor = null, t && this._texture.destroy(e), this._texture = null, this.shader = null
            }, i.fromFrame = function(t) {
                var e = h.TextureCache[t];
                if (!e) throw new Error('The frameId "' + t + '" does not exist in the texture cache');
                return new i(e)
            }, i.fromImage = function(t, e, r) {
                return new i(o.fromImage(t, e, r))
            }
        }, {
            "../const": 20,
            "../display/Container": 21,
            "../math": 30,
            "../renderers/canvas/utils/CanvasTinter": 45,
            "../textures/Texture": 69,
            "../utils": 74
        }],
        65: [function(t, e, r) {
            function i(t) {
                n.call(this, t), this.vertSize = 5, this.vertByteSize = 4 * this.vertSize, this.size = s.SPRITE_BATCH_SIZE;
                var e = 4 * this.size * this.vertByteSize,
                    r = 6 * this.size;
                this.vertices = new ArrayBuffer(e), this.positions = new Float32Array(this.vertices), this.colors = new Uint32Array(this.vertices), this.indices = new Uint16Array(r);
                for (var i = 0, o = 0; r > i; i += 6, o += 4) this.indices[i + 0] = o + 0, this.indices[i + 1] = o + 1, this.indices[i + 2] = o + 2, this.indices[i + 3] = o + 0, this.indices[i + 4] = o + 2, this.indices[i + 5] = o + 3;
                this.currentBatchSize = 0, this.sprites = [], this.shader = null
            }
            var n = t("../../renderers/webgl/utils/ObjectRenderer"),
                o = t("../../renderers/webgl/WebGLRenderer"),
                s = t("../../const");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, o.registerPlugin("sprite", i), i.prototype.onContextChange = function() {
                var t = this.renderer.gl;
                this.shader = this.renderer.shaderManager.defaultShader, this.vertexBuffer = t.createBuffer(), this.indexBuffer = t.createBuffer(), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indexBuffer), t.bufferData(t.ELEMENT_ARRAY_BUFFER, this.indices, t.STATIC_DRAW), t.bindBuffer(t.ARRAY_BUFFER, this.vertexBuffer), t.bufferData(t.ARRAY_BUFFER, this.vertices, t.DYNAMIC_DRAW), this.currentBlendMode = 99999
            }, i.prototype.render = function(t) {
                var e = t._texture;
                this.currentBatchSize >= this.size && this.flush();
                var r = e._uvs;
                if (r) {
                    var i, n, o, s, a = t.anchor.x,
                        h = t.anchor.y;
                    if (e.trim && void 0 === t.tileScale) {
                        var u = e.trim;
                        n = u.x - a * u.width, i = n + e.crop.width, s = u.y - h * u.height, o = s + e.crop.height
                    } else i = e._frame.width * (1 - a), n = e._frame.width * -a, o = e._frame.height * (1 - h), s = e._frame.height * -h;
                    var l = this.currentBatchSize * this.vertByteSize,
                        c = t.worldTransform,
                        p = c.a,
                        d = c.b,
                        f = c.c,
                        v = c.d,
                        g = c.tx,
                        m = c.ty,
                        y = this.colors,
                        x = this.positions;
                    this.renderer.roundPixels ? (x[l] = p * n + f * s + g | 0, x[l + 1] = v * s + d * n + m | 0, x[l + 5] = p * i + f * s + g | 0, x[l + 6] = v * s + d * i + m | 0, x[l + 10] = p * i + f * o + g | 0, x[l + 11] = v * o + d * i + m | 0, x[l + 15] = p * n + f * o + g | 0, x[l + 16] = v * o + d * n + m | 0) : (x[l] = p * n + f * s + g, x[l + 1] = v * s + d * n + m, x[l + 5] = p * i + f * s + g, x[l + 6] = v * s + d * i + m, x[l + 10] = p * i + f * o + g, x[l + 11] = v * o + d * i + m, x[l + 15] = p * n + f * o + g, x[l + 16] = v * o + d * n + m), x[l + 2] = r.x0, x[l + 3] = r.y0, x[l + 7] = r.x1, x[l + 8] = r.y1, x[l + 12] = r.x2, x[l + 13] = r.y2, x[l + 17] = r.x3, x[l + 18] = r.y3;
                    var b = t.tint;
                    y[l + 4] = y[l + 9] = y[l + 14] = y[l + 19] = (b >> 16) + (65280 & b) + ((255 & b) << 16) + (255 * t.worldAlpha << 24), this.sprites[this.currentBatchSize++] = t
                }
            }, i.prototype.flush = function() {
                if (0 !== this.currentBatchSize) {
                    var t, e = this.renderer.gl;
                    if (this.currentBatchSize > .5 * this.size) e.bufferSubData(e.ARRAY_BUFFER, 0, this.vertices);
                    else {
                        var r = this.positions.subarray(0, this.currentBatchSize * this.vertByteSize);
                        e.bufferSubData(e.ARRAY_BUFFER, 0, r)
                    }
                    for (var i, n, o, s, a = 0, h = 0, u = null, l = this.renderer.blendModeManager.currentBlendMode, c = null, p = !1, d = !1, f = 0, v = this.currentBatchSize; v > f; f++) s = this.sprites[f], i = s._texture.baseTexture, n = s.blendMode, o = s.shader || this.shader, p = l !== n, d = c !== o, (u !== i || p || d) && (this.renderBatch(u, a, h), h = f, a = 0, u = i, p && (l = n, this.renderer.blendModeManager.setBlendMode(l)), d && (c = o, t = c.shaders ? c.shaders[e.id] : c, t || (t = c.getShader(this.renderer)), this.renderer.shaderManager.setShader(t), t.uniforms.projectionMatrix.value = this.renderer.currentRenderTarget.projectionMatrix.toArray(!0), t.syncUniforms(), e.activeTexture(e.TEXTURE0))), a++;
                    this.renderBatch(u, a, h), this.currentBatchSize = 0
                }
            }, i.prototype.renderBatch = function(t, e, r) {
                if (0 !== e) {
                    var i = this.renderer.gl;
                    t._glTextures[i.id] ? i.bindTexture(i.TEXTURE_2D, t._glTextures[i.id]) : this.renderer.updateTexture(t), i.drawElements(i.TRIANGLES, 6 * e, i.UNSIGNED_SHORT, 6 * r * 2), this.renderer.drawCount++
                }
            }, i.prototype.start = function() {
                var t = this.renderer.gl;
                t.bindBuffer(t.ARRAY_BUFFER, this.vertexBuffer), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                var e = this.vertByteSize;
                t.vertexAttribPointer(this.shader.attributes.aVertexPosition, 2, t.FLOAT, !1, e, 0), t.vertexAttribPointer(this.shader.attributes.aTextureCoord, 2, t.FLOAT, !1, e, 8), t.vertexAttribPointer(this.shader.attributes.aColor, 4, t.UNSIGNED_BYTE, !0, e, 16)
            }, i.prototype.destroy = function() {
                this.renderer.gl.deleteBuffer(this.vertexBuffer), this.renderer.gl.deleteBuffer(this.indexBuffer), n.prototype.destroy.call(this), this.shader.destroy(), this.renderer = null, this.vertices = null, this.positions = null, this.colors = null, this.indices = null, this.vertexBuffer = null, this.indexBuffer = null, this.sprites = null, this.shader = null
            }
        }, {
            "../../const": 20,
            "../../renderers/webgl/WebGLRenderer": 46,
            "../../renderers/webgl/utils/ObjectRenderer": 60
        }],
        66: [function(t, e, r) {
            function i(t, e, r) {
                this.canvas = document.createElement("canvas"), this.context = this.canvas.getContext("2d"), this.resolution = r || h.RESOLUTION, this._text = null, this._style = null;
                var i = o.fromCanvas(this.canvas);
                i.trim = new s.Rectangle, n.call(this, i), this.text = t, this.style = e
            }
            var n = t("../sprites/Sprite"),
                o = t("../textures/Texture"),
                s = t("../math"),
                a = t("../utils"),
                h = t("../const");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.fontPropertiesCache = {}, i.fontPropertiesCanvas = document.createElement("canvas"), i.fontPropertiesContext = i.fontPropertiesCanvas.getContext("2d"), Object.defineProperties(i.prototype, {
                width: {
                    get: function() {
                        return this.dirty && this.updateText(), this.scale.x * this._texture._frame.width
                    },
                    set: function(t) {
                        this.scale.x = t / this._texture._frame.width, this._width = t
                    }
                },
                height: {
                    get: function() {
                        return this.dirty && this.updateText(), this.scale.y * this._texture._frame.height
                    },
                    set: function(t) {
                        this.scale.y = t / this._texture._frame.height, this._height = t
                    }
                },
                style: {
                    get: function() {
                        return this._style
                    },
                    set: function(t) {
                        t = t || {}, "number" == typeof t.fill && (t.fill = a.hex2string(t.fill)), "number" == typeof t.stroke && (t.stroke = a.hex2string(t.stroke)), "number" == typeof t.dropShadowColor && (t.dropShadowColor = a.hex2string(t.dropShadowColor)), t.font = t.font || "bold 20pt Arial", t.fill = t.fill || "black", t.align = t.align || "left", t.stroke = t.stroke || "black", t.strokeThickness = t.strokeThickness || 0, t.wordWrap = t.wordWrap || !1, t.wordWrapWidth = t.wordWrapWidth || 100, t.dropShadow = t.dropShadow || !1, t.dropShadowColor = t.dropShadowColor || "#000000", t.dropShadowAngle = t.dropShadowAngle || Math.PI / 6, t.dropShadowDistance = t.dropShadowDistance || 5, t.padding = t.padding || 0, t.textBaseline = t.textBaseline || "alphabetic", t.lineJoin = t.lineJoin || "miter", t.miterLimit = t.miterLimit || 10, this._style = t, this.dirty = !0
                    }
                },
                text: {
                    get: function() {
                        return this._text
                    },
                    set: function(t) {
                        t = t.toString() || " ", this._text !== t && (this._text = t, this.dirty = !0)
                    }
                }
            }), i.prototype.updateText = function() {
                var t = this._style;
                this.context.font = t.font;
                for (var e = t.wordWrap ? this.wordWrap(this._text) : this._text, r = e.split(/(?:\r\n|\r|\n)/), i = new Array(r.length), n = 0, o = this.determineFontProperties(t.font), s = 0; s < r.length; s++) {
                    var a = this.context.measureText(r[s]).width;
                    i[s] = a, n = Math.max(n, a)
                }
                var h = n + t.strokeThickness;
                t.dropShadow && (h += t.dropShadowDistance), this.canvas.width = (h + this.context.lineWidth) * this.resolution;
                var u = this.style.lineHeight || o.fontSize + t.strokeThickness,
                    l = u * r.length;
                t.dropShadow && (l += t.dropShadowDistance), this.canvas.height = (l + 2 * this._style.padding) * this.resolution, this.context.scale(this.resolution, this.resolution), navigator.isCocoonJS && this.context.clearRect(0, 0, this.canvas.width, this.canvas.height), this.context.font = t.font, this.context.strokeStyle = t.stroke, this.context.lineWidth = t.strokeThickness, this.context.textBaseline = t.textBaseline, this.context.lineJoin = t.lineJoin, this.context.miterLimit = t.miterLimit;
                var c, p;
                if (t.dropShadow) {
                    this.context.fillStyle = t.dropShadowColor;
                    var d = Math.cos(t.dropShadowAngle) * t.dropShadowDistance,
                        f = Math.sin(t.dropShadowAngle) * t.dropShadowDistance;
                    for (s = 0; s < r.length; s++) c = t.strokeThickness / 2, p = t.strokeThickness / 2 + s * u + o.ascent, "right" === t.align ? c += n - i[s] : "center" === t.align && (c += (n - i[s]) / 2), t.fill && this.context.fillText(r[s], c + d, p + f + this._style.padding)
                }
                for (this.context.fillStyle = t.fill, s = 0; s < r.length; s++) c = t.strokeThickness / 2, p = t.strokeThickness / 2 + s * u + o.ascent, "right" === t.align ? c += n - i[s] : "center" === t.align && (c += (n - i[s]) / 2), t.stroke && t.strokeThickness && this.context.strokeText(r[s], c, p + this._style.padding), t.fill && this.context.fillText(r[s], c, p + this._style.padding);
                this.updateTexture()
            }, i.prototype.updateTexture = function() {
                var t = this._texture;
                t.baseTexture.hasLoaded = !0, t.baseTexture.resolution = this.resolution, t.baseTexture.width = this.canvas.width / this.resolution, t.baseTexture.height = this.canvas.height / this.resolution, t.crop.width = t._frame.width = this.canvas.width / this.resolution, t.crop.height = t._frame.height = this.canvas.height / this.resolution, t.trim.x = 0, t.trim.y = -this._style.padding, t.trim.width = t._frame.width, t.trim.height = t._frame.height - 2 * this._style.padding, this._width = this.canvas.width / this.resolution, this._height = this.canvas.height / this.resolution, t.baseTexture.emit("update", t.baseTexture), this.dirty = !1
            }, i.prototype.renderWebGL = function(t) {
                this.dirty && this.updateText(), n.prototype.renderWebGL.call(this, t)
            }, i.prototype._renderCanvas = function(t) {
                this.dirty && this.updateText(), n.prototype._renderCanvas.call(this, t)
            }, i.prototype.determineFontProperties = function(t) {
                var e = i.fontPropertiesCache[t];
                if (!e) {
                    e = {};
                    var r = i.fontPropertiesCanvas,
                        n = i.fontPropertiesContext;
                    n.font = t;
                    var o = Math.ceil(n.measureText("|MÉq").width),
                        s = Math.ceil(n.measureText("M").width),
                        a = 2 * s;
                    s = 1.4 * s | 0, r.width = o, r.height = a, n.fillStyle = "#f00", n.fillRect(0, 0, o, a), n.font = t, n.textBaseline = "alphabetic", n.fillStyle = "#000", n.fillText("|MÉq", 0, s);
                    var h, u, l = n.getImageData(0, 0, o, a).data,
                        c = l.length,
                        p = 4 * o,
                        d = 0,
                        f = !1;
                    for (h = 0; s > h; h++) {
                        for (u = 0; p > u; u += 4)
                            if (255 !== l[d + u]) {
                                f = !0;
                                break
                            }
                        if (f) break;
                        d += p
                    }
                    for (e.ascent = s - h, d = c - p, f = !1, h = a; h > s; h--) {
                        for (u = 0; p > u; u += 4)
                            if (255 !== l[d + u]) {
                                f = !0;
                                break
                            }
                        if (f) break;
                        d -= p
                    }
                    e.descent = h - s, e.fontSize = e.ascent + e.descent, i.fontPropertiesCache[t] = e
                }
                return e
            }, i.prototype.wordWrap = function(t) {
                for (var e = "", r = t.split("\n"), i = this._style.wordWrapWidth, n = 0; n < r.length; n++) {
                    for (var o = i, s = r[n].split(" "), a = 0; a < s.length; a++) {
                        var h = this.context.measureText(s[a]).width,
                            u = h + this.context.measureText(" ").width;
                        0 === a || u > o ? (a > 0 && (e += "\n"), e += s[a], o = i - h) : (o -= u, e += " " + s[a])
                    }
                    n < r.length - 1 && (e += "\n")
                }
                return e
            }, i.prototype.getBounds = function(t) {
                return this.dirty && this.updateText(), n.prototype.getBounds.call(this, t)
            }, i.prototype.destroy = function(t) {
                this.context = null, this.canvas = null, this._style = null, this._texture.destroy(void 0 === t ? !0 : t)
            }
        }, {
            "../const": 20,
            "../math": 30,
            "../sprites/Sprite": 64,
            "../textures/Texture": 69,
            "../utils": 74
        }],
        67: [function(t, e, r) {
            function i(t, e, r) {
                s.call(this), this.uid = n.uid(), this.resolution = r || 1, this.width = 100, this.height = 100, this.realWidth = 100, this.realHeight = 100, this.scaleMode = e || o.SCALE_MODES.DEFAULT, this.hasLoaded = !1, this.isLoading = !1, this.source = null, this.premultipliedAlpha = !0, this.imageUrl = null, this.isPowerOfTwo = !1, this.mipmap = !1, this._glTextures = [], t && this.loadSource(t)
            }
            var n = t("../utils"),
                o = t("../const"),
                s = t("eventemitter3");
            i.prototype = Object.create(s.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.update = function() {
                this.realWidth = this.source.naturalWidth || this.source.width, this.realHeight = this.source.naturalHeight || this.source.height, this.width = this.realWidth / this.resolution, this.height = this.realHeight / this.resolution, this.isPowerOfTwo = n.isPowerOfTwo(this.realWidth, this.realHeight), this.emit("update", this)
            }, i.prototype.loadSource = function(t) {
                var e = this.isLoading;
                if (this.hasLoaded = !1, this.isLoading = !1, e && this.source && (this.source.onload = null, this.source.onerror = null), this.source = t, (this.source.complete || this.source.getContext) && this.source.width && this.source.height) this._sourceLoaded();
                else if (!t.getContext) {
                    this.isLoading = !0;
                    var r = this;
                    t.onload = function() {
                        t.onload = null, t.onerror = null, r.isLoading && (r.isLoading = !1, r._sourceLoaded(), r.emit("loaded", r))
                    }, t.onerror = function() {
                        t.onload = null, t.onerror = null, r.isLoading && (r.isLoading = !1, r.emit("error", r))
                    }, t.complete && t.src && (this.isLoading = !1, t.onload = null, t.onerror = null, t.width && t.height ? (this._sourceLoaded(), e && this.emit("loaded", this)) : e && this.emit("error", this))
                }
            }, i.prototype._sourceLoaded = function() {
                this.hasLoaded = !0, this.update()
            }, i.prototype.destroy = function() {
                this.imageUrl ? (delete n.BaseTextureCache[this.imageUrl], delete n.TextureCache[this.imageUrl], this.imageUrl = null, navigator.isCocoonJS || (this.source.src = "")) : this.source && this.source._pixiId && delete n.BaseTextureCache[this.source._pixiId], this.source = null, this.dispose()
            }, i.prototype.dispose = function() {
                this.emit("dispose", this), this._glTextures.length = 0
            }, i.prototype.updateSourceImage = function(t) {
                this.source.src = t, this.loadSource(this.source)
            }, i.fromImage = function(t, e, r) {
                var o = n.BaseTextureCache[t];
                if (void 0 === e && 0 !== t.indexOf("data:") && (e = !0), !o) {
                    var s = new Image;
                    e && (s.crossOrigin = ""), o = new i(s, r), o.imageUrl = t, s.src = t, n.BaseTextureCache[t] = o, o.resolution = n.getResolutionOfUrl(t)
                }
                return o
            }, i.fromCanvas = function(t, e) {
                t._pixiId || (t._pixiId = "canvas_" + n.uid());
                var r = n.BaseTextureCache[t._pixiId];
                return r || (r = new i(t, e), n.BaseTextureCache[t._pixiId] = r), r
            }
        }, {
            "../const": 20,
            "../utils": 74,
            eventemitter3: 10
        }],
        68: [function(t, e, r) {
            function i(t, e, r, i, c) {
                if (!t) throw new Error("Unable to create RenderTexture, you must pass a renderer into the constructor.");
                e = e || 100, r = r || 100, c = c || l.RESOLUTION;
                var p = new n;
                if (p.width = e, p.height = r, p.resolution = c, p.scaleMode = i || l.SCALE_MODES.DEFAULT, p.hasLoaded = !0, o.call(this, p, new u.Rectangle(0, 0, e, r)), this.width = e, this.height = r, this.resolution = c, this.render = null, this.renderer = t, this.renderer.type === l.RENDERER_TYPE.WEBGL) {
                    var d = this.renderer.gl;
                    this.textureBuffer = new s(d, this.width, this.height, p.scaleMode, this.resolution), this.baseTexture._glTextures[d.id] = this.textureBuffer.texture, this.filterManager = new a(this.renderer), this.filterManager.onContextChange(), this.filterManager.resize(e, r), this.render = this.renderWebGL, this.renderer.currentRenderer.start(), this.renderer.currentRenderTarget.activate()
                } else this.render = this.renderCanvas, this.textureBuffer = new h(this.width * this.resolution, this.height * this.resolution), this.baseTexture.source = this.textureBuffer.canvas;
                this.valid = !0, this._updateUvs()
            }
            var n = t("./BaseTexture"),
                o = t("./Texture"),
                s = t("../renderers/webgl/utils/RenderTarget"),
                a = t("../renderers/webgl/managers/FilterManager"),
                h = t("../renderers/canvas/utils/CanvasBuffer"),
                u = t("../math"),
                l = t("../const"),
                c = new u.Matrix;
            i.prototype = Object.create(o.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.resize = function(t, e, r) {
                (t !== this.width || e !== this.height) && (this.valid = t > 0 && e > 0, this.width = this._frame.width = this.crop.width = t, this.height = this._frame.height = this.crop.height = e, r && (this.baseTexture.width = this.width, this.baseTexture.height = this.height), this.valid && (this.textureBuffer.resize(this.width, this.height), this.filterManager && this.filterManager.resize(this.width, this.height)))
            }, i.prototype.clear = function() {
                this.valid && (this.renderer.type === l.RENDERER_TYPE.WEBGL && this.renderer.gl.bindFramebuffer(this.renderer.gl.FRAMEBUFFER, this.textureBuffer.frameBuffer), this.textureBuffer.clear())
            }, i.prototype.renderWebGL = function(t, e, r, i) {
                if (this.valid) {
                    if (i = void 0 !== i ? i : !0, this.textureBuffer.transform = e, this.textureBuffer.activate(), t.worldAlpha = 1, i) {
                        t.worldTransform.identity(), t.currentBounds = null;
                        var n, o, s = t.children;
                        for (n = 0, o = s.length; o > n; ++n) s[n].updateTransform()
                    }
                    var a = this.renderer.filterManager;
                    this.renderer.filterManager = this.filterManager, this.renderer.renderDisplayObject(t, this.textureBuffer, r), this.renderer.filterManager = a
                }
            }, i.prototype.renderCanvas = function(t, e, r, i) {
                if (this.valid) {
                    i = !!i;
                    var n = c;
                    n.identity(), e && n.append(e), t.worldTransform = n;
                    var o = t.worldTransform;
                    t.worldAlpha = 1;
                    var s, a, h = t.children;
                    for (s = 0, a = h.length; a > s; ++s) h[s].updateTransform();
                    r && this.textureBuffer.clear();
                    var u = this.textureBuffer.context,
                        l = this.renderer.resolution;
                    this.renderer.resolution = this.resolution, this.renderer.renderDisplayObject(t, u), this.renderer.resolution = l, t.worldTransform = o
                }
            }, i.prototype.destroy = function() {
                o.prototype.destroy.call(this, !0), this.textureBuffer.destroy(), this.filterManager && this.filterManager.destroy(), this.renderer = null
            }, i.prototype.getImage = function() {
                var t = new Image;
                return t.src = this.getBase64(), t
            }, i.prototype.getBase64 = function() {
                return this.getCanvas().toDataURL()
            }, i.prototype.getCanvas = function() {
                if (this.renderer.type === l.RENDERER_TYPE.WEBGL) {
                    var t = this.renderer.gl,
                        e = this.textureBuffer.size.width,
                        r = this.textureBuffer.size.height,
                        i = new Uint8Array(4 * e * r);
                    t.bindFramebuffer(t.FRAMEBUFFER, this.textureBuffer.frameBuffer), t.readPixels(0, 0, e, r, t.RGBA, t.UNSIGNED_BYTE, i), t.bindFramebuffer(t.FRAMEBUFFER, null);
                    var n = new h(e, r),
                        o = n.context.getImageData(0, 0, e, r);
                    return o.data.set(i), n.context.putImageData(o, 0, 0), n.canvas
                }
                return this.textureBuffer.canvas
            }, i.prototype.getPixels = function() {
                var t, e;
                if (this.renderer.type === l.RENDERER_TYPE.WEBGL) {
                    var r = this.renderer.gl;
                    t = this.textureBuffer.size.width, e = this.textureBuffer.size.height;
                    var i = new Uint8Array(4 * t * e);
                    return r.bindFramebuffer(r.FRAMEBUFFER, this.textureBuffer.frameBuffer), r.readPixels(0, 0, t, e, r.RGBA, r.UNSIGNED_BYTE, i), r.bindFramebuffer(r.FRAMEBUFFER, null), i
                }
                return t = this.textureBuffer.canvas.width, e = this.textureBuffer.canvas.height, this.textureBuffer.canvas.getContext("2d").getImageData(0, 0, t, e).data
            }, i.prototype.getPixel = function(t, e) {
                if (this.renderer.type === l.RENDERER_TYPE.WEBGL) {
                    var r = this.renderer.gl,
                        i = new Uint8Array(4);
                    return r.bindFramebuffer(r.FRAMEBUFFER, this.textureBuffer.frameBuffer), r.readPixels(t, e, 1, 1, r.RGBA, r.UNSIGNED_BYTE, i), r.bindFramebuffer(r.FRAMEBUFFER, null), i
                }
                return this.textureBuffer.canvas.getContext("2d").getImageData(t, e, 1, 1).data
            }
        }, {
            "../const": 20,
            "../math": 30,
            "../renderers/canvas/utils/CanvasBuffer": 42,
            "../renderers/webgl/managers/FilterManager": 51,
            "../renderers/webgl/utils/RenderTarget": 62,
            "./BaseTexture": 67,
            "./Texture": 69
        }],
        69: [function(t, e, r) {
            function i(t, e, r, n, o) {
                a.call(this), this.noFrame = !1, e || (this.noFrame = !0, e = new h.Rectangle(0, 0, 1, 1)), t instanceof i && (t = t.baseTexture), this.baseTexture = t, this._frame = e, this.trim = n, this.valid = !1, this.requiresUpdate = !1, this._uvs = null, this.width = 0, this.height = 0, this.crop = r || e, this.rotate = !!o, t.hasLoaded ? (this.noFrame && (e = new h.Rectangle(0, 0, t.width, t.height), t.on("update", this.onBaseTextureUpdated, this)), this.frame = e) : t.once("loaded", this.onBaseTextureLoaded, this)
            }
            var n = t("./BaseTexture"),
                o = t("./VideoBaseTexture"),
                s = t("./TextureUvs"),
                a = t("eventemitter3"),
                h = t("../math"),
                u = t("../utils");
            i.prototype = Object.create(a.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                frame: {
                    get: function() {
                        return this._frame
                    },
                    set: function(t) {
                        if (this._frame = t, this.noFrame = !1, this.width = t.width, this.height = t.height, !this.trim && !this.rotate && (t.x + t.width > this.baseTexture.width || t.y + t.height > this.baseTexture.height)) throw new Error("Texture Error: frame does not fit inside the base Texture dimensions " + this);
                        this.valid = t && t.width && t.height && this.baseTexture.hasLoaded, this.trim ? (this.width = this.trim.width, this.height = this.trim.height, this._frame.width = this.trim.width, this._frame.height = this.trim.height) : this.crop = t, this.valid && this._updateUvs()
                    }
                }
            }), i.prototype.update = function() {
                this.baseTexture.update()
            }, i.prototype.onBaseTextureLoaded = function(t) {
                this.noFrame ? this.frame = new h.Rectangle(0, 0, t.width, t.height) : this.frame = this._frame, this.emit("update", this)
            }, i.prototype.onBaseTextureUpdated = function(t) {
                this._frame.width = t.width, this._frame.height = t.height, this.emit("update", this)
            }, i.prototype.destroy = function(t) {
                this.baseTexture && (t && this.baseTexture.destroy(), this.baseTexture.off("update", this.onBaseTextureUpdated, this), this.baseTexture.off("loaded", this.onBaseTextureLoaded, this), this.baseTexture = null), this._frame = null, this._uvs = null, this.trim = null, this.crop = null, this.valid = !1, this.off("dispose", this.dispose, this), this.off("update", this.update, this)
            }, i.prototype.clone = function() {
                return new i(this.baseTexture, this.frame, this.crop, this.trim, this.rotate)
            }, i.prototype._updateUvs = function() {
                this._uvs || (this._uvs = new s), this._uvs.set(this.crop, this.baseTexture, this.rotate)
            }, i.fromImage = function(t, e, r) {
                var o = u.TextureCache[t];
                return o || (o = new i(n.fromImage(t, e, r)), u.TextureCache[t] = o), o
            }, i.fromFrame = function(t) {
                var e = u.TextureCache[t];
                if (!e) throw new Error('The frameId "' + t + '" does not exist in the texture cache');
                return e
            }, i.fromCanvas = function(t, e) {
                return new i(n.fromCanvas(t, e))
            }, i.fromVideo = function(t, e) {
                return "string" == typeof t ? i.fromVideoUrl(t, e) : new i(o.fromVideo(t, e))
            }, i.fromVideoUrl = function(t, e) {
                return new i(o.fromUrl(t, e))
            }, i.addTextureToCache = function(t, e) {
                u.TextureCache[e] = t
            }, i.removeTextureFromCache = function(t) {
                var e = u.TextureCache[t];
                return delete u.TextureCache[t], delete u.BaseTextureCache[t], e
            }, i.EMPTY = new i(new n)
        }, {
            "../math": 30,
            "../utils": 74,
            "./BaseTexture": 67,
            "./TextureUvs": 70,
            "./VideoBaseTexture": 71,
            eventemitter3: 10
        }],
        70: [function(t, e, r) {
            function i() {
                this.x0 = 0, this.y0 = 0, this.x1 = 1, this.y1 = 0, this.x2 = 1, this.y2 = 1, this.x3 = 0, this.y3 = 1
            }
            e.exports = i, i.prototype.set = function(t, e, r) {
                var i = e.width,
                    n = e.height;
                r ? (this.x0 = (t.x + t.height) / i, this.y0 = t.y / n, this.x1 = (t.x + t.height) / i, this.y1 = (t.y + t.width) / n, this.x2 = t.x / i, this.y2 = (t.y + t.width) / n, this.x3 = t.x / i, this.y3 = t.y / n) : (this.x0 = t.x / i, this.y0 = t.y / n, this.x1 = (t.x + t.width) / i, this.y1 = t.y / n, this.x2 = (t.x + t.width) / i, this.y2 = (t.y + t.height) / n, this.x3 = t.x / i, this.y3 = (t.y + t.height) / n)
            }
        }, {}],
        71: [function(t, e, r) {
            function i(t, e) {
                if (!t) throw new Error("No video source element specified.");
                (t.readyState === t.HAVE_ENOUGH_DATA || t.readyState === t.HAVE_FUTURE_DATA) && t.width && t.height && (t.complete = !0), o.call(this, t, e), this.autoUpdate = !1, this._onUpdate = this._onUpdate.bind(this), this._onCanPlay = this._onCanPlay.bind(this), t.complete || (t.addEventListener("canplay", this._onCanPlay), t.addEventListener("canplaythrough", this._onCanPlay), t.addEventListener("play", this._onPlayStart.bind(this)), t.addEventListener("pause", this._onPlayStop.bind(this))), this.__loaded = !1
            }

            function n(t, e) {
                e || (e = "video/" + t.substr(t.lastIndexOf(".") + 1));
                var r = document.createElement("source");
                return r.src = t, r.type = e, r
            }
            var o = t("./BaseTexture"),
                s = t("../utils");
            i.prototype = Object.create(o.prototype), i.prototype.constructor = i, e.exports = i, i.prototype._onUpdate = function() {
                this.autoUpdate && (window.requestAnimationFrame(this._onUpdate), this.update())
            }, i.prototype._onPlayStart = function() {
                this.autoUpdate || (window.requestAnimationFrame(this._onUpdate), this.autoUpdate = !0)
            }, i.prototype._onPlayStop = function() {
                this.autoUpdate = !1
            }, i.prototype._onCanPlay = function() {
                this.hasLoaded = !0, this.source && (this.source.removeEventListener("canplay", this._onCanPlay), this.source.removeEventListener("canplaythrough", this._onCanPlay), this.width = this.source.videoWidth, this.height = this.source.videoHeight, this.source.play(), this.__loaded || (this.__loaded = !0, this.emit("loaded", this)))
            }, i.prototype.destroy = function() {
                this.source && this.source._pixiId && (delete s.BaseTextureCache[this.source._pixiId], delete this.source._pixiId), o.prototype.destroy.call(this)
            }, i.fromVideo = function(t, e) {
                t._pixiId || (t._pixiId = "video_" + s.uid());
                var r = s.BaseTextureCache[t._pixiId];
                return r || (r = new i(t, e), s.BaseTextureCache[t._pixiId] = r), r
            }, i.fromUrl = function(t, e) {
                var r = document.createElement("video");
                if (Array.isArray(t))
                    for (var o = 0; o < t.length; ++o) r.appendChild(n(t[o].src || t[o], t[o].mime));
                else r.appendChild(n(t.src || t, t.mime));
                return r.load(), r.play(), i.fromVideo(r, e)
            }, i.fromUrls = i.fromUrl
        }, {
            "../utils": 74,
            "./BaseTexture": 67
        }],
        72: [function(t, e, r) {
            function i() {
                var t = this;
                this._tick = function(e) {
                    t._requestId = null, t.started && (t.update(e), t.started && null === t._requestId && t._emitter.listeners(s, !0) && (t._requestId = requestAnimationFrame(t._tick)))
                }, this._emitter = new o, this._requestId = null, this._maxElapsedMS = 100, this.autoStart = !1, this.deltaTime = 1, this.elapsedMS = 1 / n.TARGET_FPMS, this.lastTime = 0, this.speed = 1, this.started = !1
            }
            var n = t("../const"),
                o = t("eventemitter3"),
                s = "tick";
            Object.defineProperties(i.prototype, {
                FPS: {
                    get: function() {
                        return 1e3 / this.elapsedMS
                    }
                },
                minFPS: {
                    get: function() {
                        return 1e3 / this._maxElapsedMS
                    },
                    set: function(t) {
                        var e = Math.min(Math.max(0, t) / 1e3, n.TARGET_FPMS);
                        this._maxElapsedMS = 1 / e
                    }
                }
            }), i.prototype._requestIfNeeded = function() {
                null === this._requestId && this._emitter.listeners(s, !0) && (this.lastTime = performance.now(), this._requestId = requestAnimationFrame(this._tick))
            }, i.prototype._cancelIfNeeded = function() {
                null !== this._requestId && (cancelAnimationFrame(this._requestId), this._requestId = null)
            }, i.prototype._startIfPossible = function() {
                this.started ? this._requestIfNeeded() : this.autoStart && this.start()
            }, i.prototype.add = function(t, e) {
                return this._emitter.on(s, t, e), this._startIfPossible(), this
            }, i.prototype.addOnce = function(t, e) {
                return this._emitter.once(s, t, e), this._startIfPossible(), this
            }, i.prototype.remove = function(t, e) {
                return this._emitter.off(s, t, e), this._emitter.listeners(s, !0) || this._cancelIfNeeded(), this
            }, i.prototype.start = function() {
                this.started || (this.started = !0, this._requestIfNeeded())
            }, i.prototype.stop = function() {
                this.started && (this.started = !1, this._cancelIfNeeded())
            }, i.prototype.update = function(t) {
                var e;
                t = t || performance.now(), e = this.elapsedMS = t - this.lastTime, e > this._maxElapsedMS && (e = this._maxElapsedMS), this.deltaTime = e * n.TARGET_FPMS * this.speed, this._emitter.emit(s, this.deltaTime), this.lastTime = t
            }, e.exports = i
        }, {
            "../const": 20,
            eventemitter3: 10
        }],
        73: [function(t, e, r) {
            var i = t("./Ticker"),
                n = new i;
            n.autoStart = !0, e.exports = {
                shared: n,
                Ticker: i
            }
        }, {
            "./Ticker": 72
        }],
        74: [function(t, e, r) {
            var i = t("../const"),
                n = e.exports = {
                    _uid: 0,
                    _saidHello: !1,
                    EventEmitter: t("eventemitter3"),
                    pluginTarget: t("./pluginTarget"),
                    async: t("async"),
                    uid: function() {
                        return ++n._uid
                    },
                    hex2rgb: function(t, e) {
                        return e = e || [], e[0] = (t >> 16 & 255) / 255, e[1] = (t >> 8 & 255) / 255, e[2] = (255 & t) / 255, e
                    },
                    hex2string: function(t) {
                        return t = t.toString(16), t = "000000".substr(0, 6 - t.length) + t, "#" + t
                    },
                    rgb2hex: function(t) {
                        return (255 * t[0] << 16) + (255 * t[1] << 8) + 255 * t[2]
                    },
                    canUseNewCanvasBlendModes: function() {
                        if ("undefined" == typeof document) return !1;
                        var t = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABAQMAAADD8p2OAAAAA1BMVEX/",
                            e = "AAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==",
                            r = new Image;
                        r.src = t + "AP804Oa6" + e;
                        var i = new Image;
                        i.src = t + "/wCKxvRF" + e;
                        var n = document.createElement("canvas");
                        n.width = 6, n.height = 1;
                        var o = n.getContext("2d");
                        o.globalCompositeOperation = "multiply", o.drawImage(r, 0, 0), o.drawImage(i, 2, 0);
                        var s = o.getImageData(2, 0, 1, 1).data;
                        return 255 === s[0] && 0 === s[1] && 0 === s[2]
                    },
                    getNextPowerOfTwo: function(t) {
                        if (t > 0 && 0 === (t & t - 1)) return t;
                        for (var e = 1; t > e;) e <<= 1;
                        return e
                    },
                    isPowerOfTwo: function(t, e) {
                        return t > 0 && 0 === (t & t - 1) && e > 0 && 0 === (e & e - 1)
                    },
                    getResolutionOfUrl: function(t) {
                        var e = i.RETINA_PREFIX.exec(t);
                        return e ? parseFloat(e[1]) : 1
                    },
                    sayHello: function(t) {
                        if (!n._saidHello) {
                            if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
                                var e = ["\n %c %c %c Pixi.js " + i.VERSION + " - ✰ " + t + " ✰  %c  %c  http://www.pixijs.com/  %c %c ♥%c♥%c♥ \n\n", "background: #ff66a5; padding:5px 0;", "background: #ff66a5; padding:5px 0;", "color: #ff66a5; background: #030307; padding:5px 0;", "background: #ff66a5; padding:5px 0;", "background: #ffc3dc; padding:5px 0;", "background: #ff66a5; padding:5px 0;", "color: #ff2424; background: #fff; padding:5px 0;", "color: #ff2424; background: #fff; padding:5px 0;", "color: #ff2424; background: #fff; padding:5px 0;"];
                                window.console.log.apply(console, e)
                            } else window.console && window.console.log("Pixi.js " + i.VERSION + " - " + t + " - http://www.pixijs.com/");
                            n._saidHello = !0
                        }
                    },
                    isWebGLSupported: function() {
                        var t = {
                            stencil: !0
                        };
                        try {
                            if (!window.WebGLRenderingContext) return !1;
                            var e = document.createElement("canvas"),
                                r = e.getContext("webgl", t) || e.getContext("experimental-webgl", t);
                            return !(!r || !r.getContextAttributes().stencil)
                        } catch (i) {
                            return !1
                        }
                    },
                    sign: function(t) {
                        return t ? 0 > t ? -1 : 1 : 0
                    },
                    TextureCache: {},
                    BaseTextureCache: {}
                }
        }, {
            "../const": 20,
            "./pluginTarget": 75,
            async: 1,
            eventemitter3: 10
        }],
        75: [function(t, e, r) {
            function i(t) {
                t.__plugins = {}, t.registerPlugin = function(e, r) {
                    t.__plugins[e] = r
                }, t.prototype.initPlugins = function() {
                    this.plugins = this.plugins || {};
                    for (var e in t.__plugins) this.plugins[e] = new t.__plugins[e](this)
                }, t.prototype.destroyPlugins = function() {
                    for (var t in this.plugins) this.plugins[t].destroy(), this.plugins[t] = null;
                    this.plugins = null
                }
            }
            e.exports = {
                mixin: function(t) {
                    i(t)
                }
            }
        }, {}],
        76: [function(t, e, r) {
            var i = t("./core"),
                n = t("./mesh"),
                o = t("./extras"),
                s = t("./filters");
            i.SpriteBatch = function() {
                throw new ReferenceError("SpriteBatch does not exist any more, please use the new ParticleContainer instead.")
            }, i.AssetLoader = function() {
                throw new ReferenceError("The loader system was overhauled in pixi v3, please see the new PIXI.loaders.Loader class.")
            }, Object.defineProperties(i, {
                Stage: {
                    get: function() {
                        return console.warn("You do not need to use a PIXI Stage any more, you can simply render any container."), i.Container
                    }
                },
                DisplayObjectContainer: {
                    get: function() {
                        return console.warn("DisplayObjectContainer has been shortened to Container, please use Container from now on."), i.Container
                    }
                },
                Strip: {
                    get: function() {
                        return console.warn("The Strip class has been renamed to Mesh and moved to mesh.Mesh, please use mesh.Mesh from now on."), n.Mesh
                    }
                },
                Rope: {
                    get: function() {
                        return console.warn("The Rope class has been moved to mesh.Rope, please use mesh.Rope from now on."), n.Rope
                    }
                },
                MovieClip: {
                    get: function() {
                        return console.warn("The MovieClip class has been moved to extras.MovieClip, please use extras.MovieClip from now on."), o.MovieClip
                    }
                },
                TilingSprite: {
                    get: function() {
                        return console.warn("The TilingSprite class has been moved to extras.TilingSprite, please use extras.TilingSprite from now on."), o.TilingSprite
                    }
                },
                BitmapText: {
                    get: function() {
                        return console.warn("The BitmapText class has been moved to extras.BitmapText, please use extras.BitmapText from now on."), o.BitmapText
                    }
                },
                blendModes: {
                    get: function() {
                        return console.warn("The blendModes has been moved to BLEND_MODES, please use BLEND_MODES from now on."), i.BLEND_MODES
                    }
                },
                scaleModes: {
                    get: function() {
                        return console.warn("The scaleModes has been moved to SCALE_MODES, please use SCALE_MODES from now on."), i.SCALE_MODES
                    }
                },
                BaseTextureCache: {
                    get: function() {
                        return console.warn("The BaseTextureCache class has been moved to utils.BaseTextureCache, please use utils.BaseTextureCache from now on."), i.utils.BaseTextureCache
                    }
                },
                TextureCache: {
                    get: function() {
                        return console.warn("The TextureCache class has been moved to utils.TextureCache, please use utils.TextureCache from now on."), i.utils.TextureCache
                    }
                },
                math: {
                    get: function() {
                        return console.warn("The math namespace is deprecated, please access members already accessible on PIXI."), i
                    }
                }
            }), i.Sprite.prototype.setTexture = function(t) {
                this.texture = t, console.warn("setTexture is now deprecated, please use the texture property, e.g : sprite.texture = texture;")
            }, o.BitmapText.prototype.setText = function(t) {
                this.text = t, console.warn("setText is now deprecated, please use the text property, e.g : myBitmapText.text = 'my text';")
            }, i.Text.prototype.setText = function(t) {
                this.text = t, console.warn("setText is now deprecated, please use the text property, e.g : myText.text = 'my text';")
            }, i.Text.prototype.setStyle = function(t) {
                this.style = t, console.warn("setStyle is now deprecated, please use the style property, e.g : myText.style = style;")
            }, i.Texture.prototype.setFrame = function(t) {
                this.frame = t, console.warn("setFrame is now deprecated, please use the frame property, e.g : myTexture.frame = frame;")
            }, Object.defineProperties(s, {
                AbstractFilter: {
                    get: function() {
                        return console.warn("filters.AbstractFilter is an undocumented alias, please use AbstractFilter from now on."), i.AbstractFilter
                    }
                },
                FXAAFilter: {
                    get: function() {
                        return console.warn("filters.FXAAFilter is an undocumented alias, please use FXAAFilter from now on."), i.FXAAFilter
                    }
                },
                SpriteMaskFilter: {
                    get: function() {
                        return console.warn("filters.SpriteMaskFilter is an undocumented alias, please use SpriteMaskFilter from now on."), i.SpriteMaskFilter
                    }
                }
            }), i.utils.uuid = function() {
                return console.warn("utils.uuid() is deprecated, please use utils.uid() from now on."), i.utils.uid()
            }
        }, {
            "./core": 27,
            "./extras": 83,
            "./filters": 100,
            "./mesh": 124
        }],
        77: [function(t, e, r) {
            function i(t, e) {
                n.Container.call(this), e = e || {}, this.textWidth = 0, this.textHeight = 0, this._glyphs = [], this._font = {
                    tint: void 0 !== e.tint ? e.tint : 16777215,
                    align: e.align || "left",
                    name: null,
                    size: 0
                }, this.font = e.font, this._text = t, this.maxWidth = 0, this.maxLineHeight = 0, this.dirty = !1, this.updateText()
            }
            var n = t("../core");
            i.prototype = Object.create(n.Container.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                tint: {
                    get: function() {
                        return this._font.tint
                    },
                    set: function(t) {
                        this._font.tint = "number" == typeof t && t >= 0 ? t : 16777215, this.dirty = !0
                    }
                },
                align: {
                    get: function() {
                        return this._font.align
                    },
                    set: function(t) {
                        this._font.align = t || "left", this.dirty = !0
                    }
                },
                font: {
                    get: function() {
                        return this._font
                    },
                    set: function(t) {
                        t && ("string" == typeof t ? (t = t.split(" "), this._font.name = 1 === t.length ? t[0] : t.slice(1).join(" "), this._font.size = t.length >= 2 ? parseInt(t[0], 10) : i.fonts[this._font.name].size) : (this._font.name = t.name, this._font.size = "number" == typeof t.size ? t.size : parseInt(t.size, 10)), this.dirty = !0)
                    }
                },
                text: {
                    get: function() {
                        return this._text
                    },
                    set: function(t) {
                        t = t.toString() || " ", this._text !== t && (this._text = t, this.dirty = !0)
                    }
                }
            }), i.prototype.updateText = function() {
                for (var t = i.fonts[this._font.name], e = new n.Point, r = null, o = [], s = 0, a = 0, h = [], u = 0, l = this._font.size / t.size, c = -1, p = 0, d = 0; d < this.text.length; d++) {
                    var f = this.text.charCodeAt(d);
                    if (c = /(\s)/.test(this.text.charAt(d)) ? d : c, /(?:\r\n|\r|\n)/.test(this.text.charAt(d))) h.push(s), a = Math.max(a, s), u++, e.x = 0, e.y += t.lineHeight, r = null;
                    else if (-1 !== c && this.maxWidth > 0 && e.x * l > this.maxWidth) o.splice(c, d - c), d = c, c = -1, h.push(s), a = Math.max(a, s), u++, e.x = 0, e.y += t.lineHeight, r = null;
                    else {
                        var v = t.chars[f];
                        v && (r && v.kerning[r] && (e.x += v.kerning[r]), o.push({
                            texture: v.texture,
                            line: u,
                            charCode: f,
                            position: new n.Point(e.x + v.xOffset, e.y + v.yOffset)
                        }), s = e.x + (v.texture.width + v.xOffset), e.x += v.xAdvance, p = Math.max(p, v.yOffset + v.texture.height), r = f)
                    }
                }
                h.push(s), a = Math.max(a, s);
                var g = [];
                for (d = 0; u >= d; d++) {
                    var m = 0;
                    "right" === this._font.align ? m = a - h[d] : "center" === this._font.align && (m = (a - h[d]) / 2), g.push(m)
                }
                var y = o.length,
                    x = this.tint;
                for (d = 0; y > d; d++) {
                    var b = this._glyphs[d];
                    b ? b.texture = o[d].texture : (b = new n.Sprite(o[d].texture), this._glyphs.push(b)), b.position.x = (o[d].position.x + g[o[d].line]) * l, b.position.y = o[d].position.y * l, b.scale.x = b.scale.y = l, b.tint = x, b.parent || this.addChild(b)
                }
                for (d = y; d < this._glyphs.length; ++d) this.removeChild(this._glyphs[d]);
                this.textWidth = a * l, this.textHeight = (e.y + t.lineHeight) * l, this.maxLineHeight = p * l
            }, i.prototype.updateTransform = function() {
                this.validate(), this.containerUpdateTransform()
            }, i.prototype.getLocalBounds = function() {
                return this.validate(), n.Container.prototype.getLocalBounds.call(this)
            }, i.prototype.validate = function() {
                this.dirty && (this.updateText(), this.dirty = !1)
            }, i.fonts = {}
        }, {
            "../core": 27
        }],
        78: [function(t, e, r) {
            function i(t) {
                n.Sprite.call(this, t[0] instanceof n.Texture ? t[0] : t[0].texture), this._textures = null, this._durations = null, this.textures = t, this.animationSpeed = 1, this.loop = !0, this.onComplete = null, this._currentTime = 0, this.playing = !1
            }
            var n = t("../core");
            i.prototype = Object.create(n.Sprite.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                totalFrames: {
                    get: function() {
                        return this._textures.length
                    }
                },
                textures: {
                    get: function() {
                        return this._textures
                    },
                    set: function(t) {
                        if (t[0] instanceof n.Texture) this._textures = t, this._durations = null;
                        else {
                            this._textures = [], this._durations = [];
                            for (var e = 0; e < t.length; e++) this._textures.push(t[e].texture), this._durations.push(t[e].time)
                        }
                    }
                },
                currentFrame: {
                    get: function() {
                        var t = Math.floor(this._currentTime) % this._textures.length;
                        return 0 > t && (t += this._textures.length), t
                    }
                }
            }), i.prototype.stop = function() {
                this.playing && (this.playing = !1, n.ticker.shared.remove(this.update, this))
            }, i.prototype.play = function() {
                this.playing || (this.playing = !0, n.ticker.shared.add(this.update, this))
            }, i.prototype.gotoAndStop = function(t) {
                this.stop(), this._currentTime = t, this._texture = this._textures[this.currentFrame]
            }, i.prototype.gotoAndPlay = function(t) {
                this._currentTime = t, this.play()
            }, i.prototype.update = function(t) {
                var e = this.animationSpeed * t;
                if (null !== this._durations) {
                    var r = this._currentTime % 1 * this._durations[this.currentFrame];
                    for (r += e / 60 * 1e3; 0 > r;) this._currentTime--, r += this._durations[this.currentFrame];
                    var i = Math.sign(this.animationSpeed * t);
                    for (this._currentTime = Math.floor(this._currentTime); r >= this._durations[this.currentFrame];) r -= this._durations[this.currentFrame] * i, this._currentTime += i;
                    this._currentTime += r / this._durations[this.currentFrame]
                } else this._currentTime += e;
                this._currentTime < 0 && !this.loop ? (this.gotoAndStop(0), this.onComplete && this.onComplete()) : this._currentTime >= this._textures.length && !this.loop ? (this.gotoAndStop(this._textures.length - 1), this.onComplete && this.onComplete()) : this._texture = this._textures[this.currentFrame]
            }, i.prototype.destroy = function() {
                this.stop(), n.Sprite.prototype.destroy.call(this)
            }, i.fromFrames = function(t) {
                for (var e = [], r = 0; r < t.length; ++r) e.push(new n.Texture.fromFrame(t[r]));
                return new i(e)
            }, i.fromImages = function(t) {
                for (var e = [], r = 0; r < t.length; ++r) e.push(new n.Texture.fromImage(t[r]));
                return new i(e)
            }
        }, {
            "../core": 27
        }],
        79: [function(t, e, r) {
            function i(t, e, r) {
                n.Sprite.call(this, t), this.tileScale = new n.Point(1, 1), this.tilePosition = new n.Point(0, 0), this._width = e || 100, this._height = r || 100, this._uvs = new n.TextureUvs, this._canvasPattern = null, this.shader = new n.AbstractFilter(["precision lowp float;", "attribute vec2 aVertexPosition;", "attribute vec2 aTextureCoord;", "attribute vec4 aColor;", "uniform mat3 projectionMatrix;", "uniform vec4 uFrame;", "uniform vec4 uTransform;", "varying vec2 vTextureCoord;", "varying vec4 vColor;", "void main(void){", "   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);", "   vec2 coord = aTextureCoord;", "   coord -= uTransform.xy;", "   coord /= uTransform.zw;", "   vTextureCoord = coord;", "   vColor = vec4(aColor.rgb * aColor.a, aColor.a);", "}"].join("\n"), ["precision lowp float;", "varying vec2 vTextureCoord;", "varying vec4 vColor;", "uniform sampler2D uSampler;", "uniform vec4 uFrame;", "uniform vec2 uPixelSize;", "void main(void){", "   vec2 coord = mod(vTextureCoord, uFrame.zw);", "   coord = clamp(coord, uPixelSize, uFrame.zw - uPixelSize);", "   coord += uFrame.xy;", "   gl_FragColor =  texture2D(uSampler, coord) * vColor ;", "}"].join("\n"), {
                    uFrame: {
                        type: "4fv",
                        value: [0, 0, 1, 1]
                    },
                    uTransform: {
                        type: "4fv",
                        value: [0, 0, 1, 1]
                    },
                    uPixelSize: {
                        type: "2fv",
                        value: [1, 1]
                    }
                })
            }
            var n = t("../core"),
                o = new n.Point,
                s = t("../core/renderers/canvas/utils/CanvasTinter");
            i.prototype = Object.create(n.Sprite.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                width: {
                    get: function() {
                        return this._width
                    },
                    set: function(t) {
                        this._width = t
                    }
                },
                height: {
                    get: function() {
                        return this._height
                    },
                    set: function(t) {
                        this._height = t
                    }
                }
            }), i.prototype._onTextureUpdate = function() {}, i.prototype._renderWebGL = function(t) {
                var e = this._texture;
                if (e && e._uvs) {
                    var r = e._uvs,
                        i = e._frame.width,
                        n = e._frame.height,
                        o = e.baseTexture.width,
                        s = e.baseTexture.height;
                    e._uvs = this._uvs, e._frame.width = this.width, e._frame.height = this.height, this.shader.uniforms.uPixelSize.value[0] = 1 / o, this.shader.uniforms.uPixelSize.value[1] = 1 / s, this.shader.uniforms.uFrame.value[0] = r.x0, this.shader.uniforms.uFrame.value[1] = r.y0, this.shader.uniforms.uFrame.value[2] = r.x1 - r.x0, this.shader.uniforms.uFrame.value[3] = r.y2 - r.y0, this.shader.uniforms.uTransform.value[0] = this.tilePosition.x % (i * this.tileScale.x) / this._width, this.shader.uniforms.uTransform.value[1] = this.tilePosition.y % (n * this.tileScale.y) / this._height, this.shader.uniforms.uTransform.value[2] = o / this._width * this.tileScale.x, this.shader.uniforms.uTransform.value[3] = s / this._height * this.tileScale.y, t.setObjectRenderer(t.plugins.sprite), t.plugins.sprite.render(this), e._uvs = r, e._frame.width = i, e._frame.height = n
                }
            }, i.prototype._renderCanvas = function(t) {
                var e = this._texture;
                if (e.baseTexture.hasLoaded) {
                    var r = t.context,
                        i = this.worldTransform,
                        o = t.resolution,
                        a = e.baseTexture,
                        h = this.tilePosition.x / this.tileScale.x % e._frame.width,
                        u = this.tilePosition.y / this.tileScale.y % e._frame.height;
                    if (!this._canvasPattern) {
                        var l = new n.CanvasBuffer(e._frame.width, e._frame.height);
                        16777215 !== this.tint ? (this.cachedTint !== this.tint && (this.cachedTint = this.tint, this.tintedTexture = s.getTintedTexture(this, this.tint)), l.context.drawImage(this.tintedTexture, 0, 0)) : l.context.drawImage(a.source, -e._frame.x, -e._frame.y), this._canvasPattern = l.context.createPattern(l.canvas, "repeat")
                    }
                    r.globalAlpha = this.worldAlpha, r.setTransform(i.a * o, i.b * o, i.c * o, i.d * o, i.tx * o, i.ty * o), r.scale(this.tileScale.x, this.tileScale.y), r.translate(h + this.anchor.x * -this._width, u + this.anchor.y * -this._height);
                    var c = t.blendModes[this.blendMode];
                    c !== t.context.globalCompositeOperation && (r.globalCompositeOperation = c), r.fillStyle = this._canvasPattern, r.fillRect(-h, -u, this._width / this.tileScale.x, this._height / this.tileScale.y)
                }
            }, i.prototype.getBounds = function() {
                var t, e, r, i, n = this._width,
                    o = this._height,
                    s = n * (1 - this.anchor.x),
                    a = n * -this.anchor.x,
                    h = o * (1 - this.anchor.y),
                    u = o * -this.anchor.y,
                    l = this.worldTransform,
                    c = l.a,
                    p = l.b,
                    d = l.c,
                    f = l.d,
                    v = l.tx,
                    g = l.ty,
                    m = c * a + d * u + v,
                    y = f * u + p * a + g,
                    x = c * s + d * u + v,
                    b = f * u + p * s + g,
                    _ = c * s + d * h + v,
                    T = f * h + p * s + g,
                    E = c * a + d * h + v,
                    S = f * h + p * a + g;
                t = m, t = t > x ? x : t, t = t > _ ? _ : t, t = t > E ? E : t, r = y, r = r > b ? b : r, r = r > T ? T : r, r = r > S ? S : r, e = m, e = x > e ? x : e, e = _ > e ? _ : e, e = E > e ? E : e, i = y, i = b > i ? b : i, i = T > i ? T : i, i = S > i ? S : i;
                var w = this._bounds;
                return w.x = t, w.width = e - t, w.y = r, w.height = i - r, this._currentBounds = w, w
            }, i.prototype.containsPoint = function(t) {
                this.worldTransform.applyInverse(t, o);
                var e, r = this._width,
                    i = this._height,
                    n = -r * this.anchor.x;
                return o.x > n && o.x < n + r && (e = -i * this.anchor.y, o.y > e && o.y < e + i) ? !0 : !1
            }, i.prototype.destroy = function() {
                n.Sprite.prototype.destroy.call(this), this.tileScale = null, this._tileScaleOffset = null, this.tilePosition = null, this._uvs = null
            }, i.fromFrame = function(t, e, r) {
                var o = n.utils.TextureCache[t];
                if (!o) throw new Error('The frameId "' + t + '" does not exist in the texture cache ' + this);
                return new i(o, e, r)
            }, i.fromImage = function(t, e, r, o, s) {
                return new i(n.Texture.fromImage(t, o, s), e, r)
            }
        }, {
            "../core": 27,
            "../core/renderers/canvas/utils/CanvasTinter": 45
        }],
        80: [function(t, e, r) {
            var i = t("../core"),
                n = i.DisplayObject,
                o = new i.Matrix;
            n.prototype._cacheAsBitmap = !1, n.prototype._originalRenderWebGL = null, n.prototype._originalRenderCanvas = null, n.prototype._originalUpdateTransform = null, n.prototype._originalHitTest = null, n.prototype._originalDestroy = null, n.prototype._cachedSprite = null, Object.defineProperties(n.prototype, {
                cacheAsBitmap: {
                    get: function() {
                        return this._cacheAsBitmap
                    },
                    set: function(t) {
                        this._cacheAsBitmap !== t && (this._cacheAsBitmap = t, t ? (this._originalRenderWebGL = this.renderWebGL, this._originalRenderCanvas = this.renderCanvas, this._originalUpdateTransform = this.updateTransform, this._originalGetBounds = this.getBounds, this._originalDestroy = this.destroy, this._originalContainsPoint = this.containsPoint, this.renderWebGL = this._renderCachedWebGL, this.renderCanvas = this._renderCachedCanvas, this.destroy = this._cacheAsBitmapDestroy) : (this._cachedSprite && this._destroyCachedDisplayObject(), this.renderWebGL = this._originalRenderWebGL, this.renderCanvas = this._originalRenderCanvas, this.getBounds = this._originalGetBounds, this.destroy = this._originalDestroy, this.updateTransform = this._originalUpdateTransform, this.containsPoint = this._originalContainsPoint))
                    }
                }
            }), n.prototype._renderCachedWebGL = function(t) {
                !this.visible || this.worldAlpha <= 0 || !this.renderable || (this._initCachedDisplayObject(t), this._cachedSprite.worldAlpha = this.worldAlpha, t.setObjectRenderer(t.plugins.sprite), t.plugins.sprite.render(this._cachedSprite))
            }, n.prototype._initCachedDisplayObject = function(t) {
                if (!this._cachedSprite) {
                    t.currentRenderer.flush();
                    var e = this.getLocalBounds().clone();
                    if (this._filters) {
                        var r = this._filters[0].padding;
                        e.x -= r, e.y -= r, e.width += 2 * r, e.height += 2 * r
                    }
                    var n = t.currentRenderTarget,
                        s = t.filterManager.filterStack,
                        a = new i.RenderTexture(t, 0 | e.width, 0 | e.height),
                        h = o;
                    h.tx = -e.x, h.ty = -e.y, this.renderWebGL = this._originalRenderWebGL, a.render(this, h, !0, !0), t.setRenderTarget(n), t.filterManager.filterStack = s, this.renderWebGL = this._renderCachedWebGL, this.updateTransform = this.displayObjectUpdateTransform, this.getBounds = this._getCachedBounds, this._cachedSprite = new i.Sprite(a), this._cachedSprite.worldTransform = this.worldTransform, this._cachedSprite.anchor.x = -(e.x / e.width), this._cachedSprite.anchor.y = -(e.y / e.height), this.updateTransform(), this.containsPoint = this._cachedSprite.containsPoint.bind(this._cachedSprite)
                }
            }, n.prototype._renderCachedCanvas = function(t) {
                !this.visible || this.worldAlpha <= 0 || !this.renderable || (this._initCachedDisplayObjectCanvas(t), this._cachedSprite.worldAlpha = this.worldAlpha, this._cachedSprite.renderCanvas(t))
            }, n.prototype._initCachedDisplayObjectCanvas = function(t) {
                if (!this._cachedSprite) {
                    var e = this.getLocalBounds(),
                        r = t.context,
                        n = new i.RenderTexture(t, 0 | e.width, 0 | e.height),
                        s = o;
                    s.tx = -e.x, s.ty = -e.y, this.renderCanvas = this._originalRenderCanvas, n.render(this, s, !0), t.context = r, this.renderCanvas = this._renderCachedCanvas, this.updateTransform = this.displayObjectUpdateTransform, this.getBounds = this._getCachedBounds, this._cachedSprite = new i.Sprite(n), this._cachedSprite.worldTransform = this.worldTransform, this._cachedSprite.anchor.x = -(e.x / e.width), this._cachedSprite.anchor.y = -(e.y / e.height), this.updateTransform(), this.containsPoint = this._cachedSprite.containsPoint.bind(this._cachedSprite)
                }
            }, n.prototype._getCachedBounds = function() {
                return this._cachedSprite._currentBounds = null, this._cachedSprite.getBounds()
            }, n.prototype._destroyCachedDisplayObject = function() {
                this._cachedSprite._texture.destroy(), this._cachedSprite = null
            }, n.prototype._cacheAsBitmapDestroy = function() {
                this.cacheAsBitmap = !1, this._originalDestroy()
            }
        }, {
            "../core": 27
        }],
        81: [function(t, e, r) {
            var i = t("../core");
            i.DisplayObject.prototype.name = null, i.Container.prototype.getChildByName = function(t) {
                for (var e = 0; e < this.children.length; e++)
                    if (this.children[e].name === t) return this.children[e];
                return null
            }
        }, {
            "../core": 27
        }],
        82: [function(t, e, r) {
            var i = t("../core");
            i.DisplayObject.prototype.getGlobalPosition = function(t) {
                return t = t || new i.Point, this.parent ? (this.displayObjectUpdateTransform(), t.x = this.worldTransform.tx, t.y = this.worldTransform.ty) : (t.x = this.position.x, t.y = this.position.y), t
            }
        }, {
            "../core": 27
        }],
        83: [function(t, e, r) {
            t("./cacheAsBitmap"), t("./getChildByName"), t("./getGlobalPosition"), e.exports = {
                MovieClip: t("./MovieClip"),
                TilingSprite: t("./TilingSprite"),
                BitmapText: t("./BitmapText")
            }
        }, {
            "./BitmapText": 77,
            "./MovieClip": 78,
            "./TilingSprite": 79,
            "./cacheAsBitmap": 80,
            "./getChildByName": 81,
            "./getGlobalPosition": 82
        }],
        84: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nuniform vec4 dimensions;\nuniform float pixelSize;\nuniform sampler2D uSampler;\n\nfloat character(float n, vec2 p)\n{\n    p = floor(p*vec2(4.0, -4.0) + 2.5);\n    if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y)\n    {\n        if (int(mod(n/exp2(p.x + 5.0*p.y), 2.0)) == 1) return 1.0;\n    }\n    return 0.0;\n}\n\nvoid main()\n{\n    vec2 uv = gl_FragCoord.xy;\n\n    vec3 col = texture2D(uSampler, floor( uv / pixelSize ) * pixelSize / dimensions.xy).rgb;\n\n    float gray = (col.r + col.g + col.b) / 3.0;\n\n    float n =  65536.0;             // .\n    if (gray > 0.2) n = 65600.0;    // :\n    if (gray > 0.3) n = 332772.0;   // *\n    if (gray > 0.4) n = 15255086.0; // o\n    if (gray > 0.5) n = 23385164.0; // &\n    if (gray > 0.6) n = 15252014.0; // 8\n    if (gray > 0.7) n = 13199452.0; // @\n    if (gray > 0.8) n = 11512810.0; // #\n\n    vec2 p = mod( uv / ( pixelSize * 0.5 ), 2.0) - vec2(1.0);\n    col = col * character(n, p);\n\n    gl_FragColor = vec4(col, 1.0);\n}\n", {
                    dimensions: {
                        type: "4fv",
                        value: new Float32Array([0, 0, 0, 0])
                    },
                    pixelSize: {
                        type: "1f",
                        value: 8
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                size: {
                    get: function() {
                        return this.uniforms.pixelSize.value
                    },
                    set: function(t) {
                        this.uniforms.pixelSize.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        85: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this), this.blurXFilter = new o, this.blurYFilter = new s, this.defaultFilter = new n.AbstractFilter
            }
            var n = t("../../core"),
                o = t("../blur/BlurXFilter"),
                s = t("../blur/BlurYFilter");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager.getRenderTarget(!0);
                this.defaultFilter.applyFilter(t, e, r), this.blurXFilter.applyFilter(t, e, i), t.blendModeManager.setBlendMode(n.BLEND_MODES.SCREEN), this.blurYFilter.applyFilter(t, i, r), t.blendModeManager.setBlendMode(n.BLEND_MODES.NORMAL), t.filterManager.returnRenderTarget(i)
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.blurXFilter.blur
                    },
                    set: function(t) {
                        this.blurXFilter.blur = this.blurYFilter.blur = t
                    }
                },
                blurX: {
                    get: function() {
                        return this.blurXFilter.blur
                    },
                    set: function(t) {
                        this.blurXFilter.blur = t
                    }
                },
                blurY: {
                    get: function() {
                        return this.blurYFilter.blur
                    },
                    set: function(t) {
                        this.blurYFilter.blur = t
                    }
                }
            })
        }, {
            "../../core": 27,
            "../blur/BlurXFilter": 88,
            "../blur/BlurYFilter": 89
        }],
        86: [function(t, e, r) {
            function i(t, e) {
                n.AbstractFilter.call(this, "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform float strength;\nuniform float dirX;\nuniform float dirY;\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying vec2 vBlurTexCoords[3];\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3((aVertexPosition), 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n\n    vBlurTexCoords[0] = aTextureCoord + vec2( (0.004 * strength) * dirX, (0.004 * strength) * dirY );\n    vBlurTexCoords[1] = aTextureCoord + vec2( (0.008 * strength) * dirX, (0.008 * strength) * dirY );\n    vBlurTexCoords[2] = aTextureCoord + vec2( (0.012 * strength) * dirX, (0.012 * strength) * dirY );\n\n    vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n", "precision lowp float;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vBlurTexCoords[3];\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    gl_FragColor = vec4(0.0);\n\n    gl_FragColor += texture2D(uSampler, vTextureCoord     ) * 0.3989422804014327;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 0]) * 0.2419707245191454;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 1]) * 0.05399096651318985;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 2]) * 0.004431848411938341;\n}\n", {
                    strength: {
                        type: "1f",
                        value: 1
                    },
                    dirX: {
                        type: "1f",
                        value: t || 0
                    },
                    dirY: {
                        type: "1f",
                        value: e || 0
                    }
                }), this.defaultFilter = new n.AbstractFilter, this.passes = 1, this.dirX = t || 0, this.dirY = e || 0, this.strength = 4
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r, i) {
                var n = this.getShader(t);
                if (this.uniforms.strength.value = this.strength / 4 / this.passes * (e.frame.width / e.size.width), 1 === this.passes) t.filterManager.applyFilter(n, e, r, i);
                else {
                    var o = t.filterManager.getRenderTarget(!0);
                    t.filterManager.applyFilter(n, e, o, i);
                    for (var s = 0; s < this.passes - 2; s++) t.filterManager.applyFilter(n, o, o, i);
                    t.filterManager.applyFilter(n, o, r, i), t.filterManager.returnRenderTarget(o)
                }
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.strength
                    },
                    set: function(t) {
                        this.padding = .5 * t, this.strength = t
                    }
                },
                dirX: {
                    get: function() {
                        return this.dirX
                    },
                    set: function(t) {
                        this.uniforms.dirX.value = t
                    }
                },
                dirY: {
                    get: function() {
                        return this.dirY
                    },
                    set: function(t) {
                        this.uniforms.dirY.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        87: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this), this.blurXFilter = new o, this.blurYFilter = new s
            }
            var n = t("../../core"),
                o = t("./BlurXFilter"),
                s = t("./BlurYFilter");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager.getRenderTarget(!0);
                this.blurXFilter.applyFilter(t, e, i), this.blurYFilter.applyFilter(t, i, r), t.filterManager.returnRenderTarget(i)
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.blurXFilter.blur
                    },
                    set: function(t) {
                        this.padding = .5 * Math.abs(t), this.blurXFilter.blur = this.blurYFilter.blur = t
                    }
                },
                passes: {
                    get: function() {
                        return this.blurXFilter.passes
                    },
                    set: function(t) {
                        this.blurXFilter.passes = this.blurYFilter.passes = t
                    }
                },
                blurX: {
                    get: function() {
                        return this.blurXFilter.blur
                    },
                    set: function(t) {
                        this.blurXFilter.blur = t
                    }
                },
                blurY: {
                    get: function() {
                        return this.blurYFilter.blur
                    },
                    set: function(t) {
                        this.blurYFilter.blur = t
                    }
                }
            })
        }, {
            "../../core": 27,
            "./BlurXFilter": 88,
            "./BlurYFilter": 89
        }],
        88: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform float strength;\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying vec2 vBlurTexCoords[6];\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3((aVertexPosition), 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n\n    vBlurTexCoords[ 0] = aTextureCoord + vec2(-0.012 * strength, 0.0);\n    vBlurTexCoords[ 1] = aTextureCoord + vec2(-0.008 * strength, 0.0);\n    vBlurTexCoords[ 2] = aTextureCoord + vec2(-0.004 * strength, 0.0);\n    vBlurTexCoords[ 3] = aTextureCoord + vec2( 0.004 * strength, 0.0);\n    vBlurTexCoords[ 4] = aTextureCoord + vec2( 0.008 * strength, 0.0);\n    vBlurTexCoords[ 5] = aTextureCoord + vec2( 0.012 * strength, 0.0);\n\n    vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n", "precision lowp float;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vBlurTexCoords[6];\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    gl_FragColor = vec4(0.0);\n\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 0])*0.004431848411938341;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 1])*0.05399096651318985;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 2])*0.2419707245191454;\n    gl_FragColor += texture2D(uSampler, vTextureCoord     )*0.3989422804014327;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 3])*0.2419707245191454;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 4])*0.05399096651318985;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 5])*0.004431848411938341;\n}\n", {
                    strength: {
                        type: "1f",
                        value: 1
                    }
                }), this.passes = 1, this.strength = 4
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r, i) {
                var n = this.getShader(t);
                if (this.uniforms.strength.value = this.strength / 4 / this.passes * (e.frame.width / e.size.width), 1 === this.passes) t.filterManager.applyFilter(n, e, r, i);
                else {
                    for (var o = t.filterManager.getRenderTarget(!0), s = e, a = o, h = 0; h < this.passes - 1; h++) {
                        t.filterManager.applyFilter(n, s, a, !0);
                        var u = a;
                        a = s, s = u
                    }
                    t.filterManager.applyFilter(n, s, r, i), t.filterManager.returnRenderTarget(o)
                }
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.strength
                    },
                    set: function(t) {
                        this.padding = .5 * Math.abs(t), this.strength = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        89: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform float strength;\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying vec2 vBlurTexCoords[6];\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3((aVertexPosition), 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n\n    vBlurTexCoords[ 0] = aTextureCoord + vec2(0.0, -0.012 * strength);\n    vBlurTexCoords[ 1] = aTextureCoord + vec2(0.0, -0.008 * strength);\n    vBlurTexCoords[ 2] = aTextureCoord + vec2(0.0, -0.004 * strength);\n    vBlurTexCoords[ 3] = aTextureCoord + vec2(0.0,  0.004 * strength);\n    vBlurTexCoords[ 4] = aTextureCoord + vec2(0.0,  0.008 * strength);\n    vBlurTexCoords[ 5] = aTextureCoord + vec2(0.0,  0.012 * strength);\n\n   vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n", "precision lowp float;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vBlurTexCoords[6];\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    gl_FragColor = vec4(0.0);\n\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 0])*0.004431848411938341;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 1])*0.05399096651318985;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 2])*0.2419707245191454;\n    gl_FragColor += texture2D(uSampler, vTextureCoord     )*0.3989422804014327;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 3])*0.2419707245191454;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 4])*0.05399096651318985;\n    gl_FragColor += texture2D(uSampler, vBlurTexCoords[ 5])*0.004431848411938341;\n}\n", {
                    strength: {
                        type: "1f",
                        value: 1
                    }
                }), this.passes = 1, this.strength = 4
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r, i) {
                var n = this.getShader(t);
                if (this.uniforms.strength.value = Math.abs(this.strength) / 4 / this.passes * (e.frame.height / e.size.height), 1 === this.passes) t.filterManager.applyFilter(n, e, r, i);
                else {
                    for (var o = t.filterManager.getRenderTarget(!0), s = e, a = o, h = 0; h < this.passes - 1; h++) {
                        t.filterManager.applyFilter(n, s, a, !0);
                        var u = a;
                        a = s, s = u
                    }
                    t.filterManager.applyFilter(n, s, r, i), t.filterManager.returnRenderTarget(o)
                }
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.strength
                    },
                    set: function(t) {
                        this.padding = .5 * Math.abs(t), this.strength = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        90: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec2 delta;\n\nfloat random(vec3 scale, float seed)\n{\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\nvoid main(void)\n{\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n    for (float t = -30.0; t <= 30.0; t++)\n    {\n        float percent = (t + offset - 0.5) / 30.0;\n        float weight = 1.0 - abs(percent);\n        vec4 sample = texture2D(uSampler, vTextureCoord + delta * percent);\n        sample.rgb *= sample.a;\n        color += sample * weight;\n        total += weight;\n    }\n\n    gl_FragColor = color / total;\n    gl_FragColor.rgb /= gl_FragColor.a + 0.00001;\n}\n", {
                    delta: {
                        type: "v2",
                        value: {
                            x: .1,
                            y: 0
                        }
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i
        }, {
            "../../core": 27
        }],
        91: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform float m[25];\n\nvoid main(void)\n{\n\n    vec4 c = texture2D(uSampler, vTextureCoord);\n\n    gl_FragColor.r = (m[0] * c.r);\n        gl_FragColor.r += (m[1] * c.g);\n        gl_FragColor.r += (m[2] * c.b);\n        gl_FragColor.r += (m[3] * c.a);\n        gl_FragColor.r += m[4];\n\n    gl_FragColor.g = (m[5] * c.r);\n        gl_FragColor.g += (m[6] * c.g);\n        gl_FragColor.g += (m[7] * c.b);\n        gl_FragColor.g += (m[8] * c.a);\n        gl_FragColor.g += m[9];\n\n     gl_FragColor.b = (m[10] * c.r);\n        gl_FragColor.b += (m[11] * c.g);\n        gl_FragColor.b += (m[12] * c.b);\n        gl_FragColor.b += (m[13] * c.a);\n        gl_FragColor.b += m[14];\n\n     gl_FragColor.a = (m[15] * c.r);\n        gl_FragColor.a += (m[16] * c.g);\n        gl_FragColor.a += (m[17] * c.b);\n        gl_FragColor.a += (m[18] * c.a);\n        gl_FragColor.a += m[19];\n\n}\n", {
                    m: {
                        type: "1fv",
                        value: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype._loadMatrix = function(t, e) {
                e = !!e;
                var r = t;
                e && (this._multiply(r, this.uniforms.m.value, t), r = this._colorMatrix(r)), this.uniforms.m.value = r
            }, i.prototype._multiply = function(t, e, r) {
                return t[0] = e[0] * r[0] + e[1] * r[5] + e[2] * r[10] + e[3] * r[15], t[1] = e[0] * r[1] + e[1] * r[6] + e[2] * r[11] + e[3] * r[16], t[2] = e[0] * r[2] + e[1] * r[7] + e[2] * r[12] + e[3] * r[17], t[3] = e[0] * r[3] + e[1] * r[8] + e[2] * r[13] + e[3] * r[18], t[4] = e[0] * r[4] + e[1] * r[9] + e[2] * r[14] + e[3] * r[19], t[5] = e[5] * r[0] + e[6] * r[5] + e[7] * r[10] + e[8] * r[15], t[6] = e[5] * r[1] + e[6] * r[6] + e[7] * r[11] + e[8] * r[16], t[7] = e[5] * r[2] + e[6] * r[7] + e[7] * r[12] + e[8] * r[17], t[8] = e[5] * r[3] + e[6] * r[8] + e[7] * r[13] + e[8] * r[18], t[9] = e[5] * r[4] + e[6] * r[9] + e[7] * r[14] + e[8] * r[19], t[10] = e[10] * r[0] + e[11] * r[5] + e[12] * r[10] + e[13] * r[15], t[11] = e[10] * r[1] + e[11] * r[6] + e[12] * r[11] + e[13] * r[16], t[12] = e[10] * r[2] + e[11] * r[7] + e[12] * r[12] + e[13] * r[17], t[13] = e[10] * r[3] + e[11] * r[8] + e[12] * r[13] + e[13] * r[18], t[14] = e[10] * r[4] + e[11] * r[9] + e[12] * r[14] + e[13] * r[19], t[15] = e[15] * r[0] + e[16] * r[5] + e[17] * r[10] + e[18] * r[15], t[16] = e[15] * r[1] + e[16] * r[6] + e[17] * r[11] + e[18] * r[16], t[17] = e[15] * r[2] + e[16] * r[7] + e[17] * r[12] + e[18] * r[17], t[18] = e[15] * r[3] + e[16] * r[8] + e[17] * r[13] + e[18] * r[18], t[19] = e[15] * r[4] + e[16] * r[9] + e[17] * r[14] + e[18] * r[19], t
            }, i.prototype._colorMatrix = function(t) {
                var e = new Float32Array(t);
                return e[4] /= 255, e[9] /= 255, e[14] /= 255, e[19] /= 255, e
            }, i.prototype.brightness = function(t, e) {
                var r = [t, 0, 0, 0, 0, 0, t, 0, 0, 0, 0, 0, t, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(r, e)
            }, i.prototype.greyscale = function(t, e) {
                var r = [t, t, t, 0, 0, t, t, t, 0, 0, t, t, t, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(r, e)
            }, i.prototype.grayscale = i.prototype.greyscale, i.prototype.blackAndWhite = function(t) {
                var e = [.3, .6, .1, 0, 0, .3, .6, .1, 0, 0, .3, .6, .1, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.hue = function(t, e) {
                t = (t || 0) / 180 * Math.PI;
                var r = Math.cos(t),
                    i = Math.sin(t),
                    n = .213,
                    o = .715,
                    s = .072,
                    a = [n + r * (1 - n) + i * -n, o + r * -o + i * -o, s + r * -s + i * (1 - s), 0, 0, n + r * -n + .143 * i, o + r * (1 - o) + .14 * i, s + r * -s + i * -.283, 0, 0, n + r * -n + i * -(1 - n), o + r * -o + i * o, s + r * (1 - s) + i * s, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(a, e)
            }, i.prototype.contrast = function(t, e) {
                var r = (t || 0) + 1,
                    i = -128 * (r - 1),
                    n = [r, 0, 0, 0, i, 0, r, 0, 0, i, 0, 0, r, 0, i, 0, 0, 0, 1, 0];
                this._loadMatrix(n, e)
            }, i.prototype.saturate = function(t, e) {
                var r = 2 * (t || 0) / 3 + 1,
                    i = (r - 1) * -.5,
                    n = [r, i, i, 0, 0, i, r, i, 0, 0, i, i, r, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(n, e)
            }, i.prototype.desaturate = function(t) {
                this.saturate(-1)
            }, i.prototype.negative = function(t) {
                var e = [0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.sepia = function(t) {
                var e = [.393, .7689999, .18899999, 0, 0, .349, .6859999, .16799999, 0, 0, .272, .5339999, .13099999, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.technicolor = function(t) {
                var e = [1.9125277891456083, -.8545344976951645, -.09155508482755585, 0, 11.793603434377337, -.3087833385928097, 1.7658908555458428, -.10601743074722245, 0, -70.35205161461398, -.231103377548616, -.7501899197440212, 1.847597816108189, 0, 30.950940869491138, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.polaroid = function(t) {
                var e = [1.438, -.062, -.062, 0, 0, -.122, 1.378, -.122, 0, 0, -.016, -.016, 1.483, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.toBGR = function(t) {
                var e = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.kodachrome = function(t) {
                var e = [1.1285582396593525, -.3967382283601348, -.03992559172921793, 0, 63.72958762196502, -.16404339962244616, 1.0835251566291304, -.05498805115633132, 0, 24.732407896706203, -.16786010706155763, -.5603416277695248, 1.6014850761964943, 0, 35.62982807460946, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.browni = function(t) {
                var e = [.5997023498159715, .34553243048391263, -.2708298674538042, 0, 47.43192855600873, -.037703249837783157, .8609577587992641, .15059552388459913, 0, -36.96841498319127, .24113635128153335, -.07441037908422492, .44972182064877153, 0, -7.562075277591283, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.vintage = function(t) {
                var e = [.6279345635605994, .3202183420819367, -.03965408211312453, 0, 9.651285835294123, .02578397704808868, .6441188644374771, .03259127616149294, 0, 7.462829176470591, .0466055556782719, -.0851232987247891, .5241648018700465, 0, 5.159190588235296, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.colorTone = function(t, e, r, i, n) {
                t = t || .2, e = e || .15, r = r || 16770432, i = i || 3375104;
                var o = (r >> 16 & 255) / 255,
                    s = (r >> 8 & 255) / 255,
                    a = (255 & r) / 255,
                    h = (i >> 16 & 255) / 255,
                    u = (i >> 8 & 255) / 255,
                    l = (255 & i) / 255,
                    c = [.3, .59, .11, 0, 0, o, s, a, t, 0, h, u, l, e, 0, o - h, s - u, a - l, 0, 0];
                this._loadMatrix(c, n)
            }, i.prototype.night = function(t, e) {
                t = t || .1;
                var r = [-2 * t, -t, 0, 0, 0, -t, 0, t, 0, 0, 0, t, 2 * t, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(r, e)
            }, i.prototype.predator = function(t, e) {
                var r = [11.224130630493164 * t, -4.794486999511719 * t, -2.8746118545532227 * t, 0 * t, .40342438220977783 * t, -3.6330697536468506 * t, 9.193157196044922 * t, -2.951810836791992 * t, 0 * t, -1.316135048866272 * t, -3.2184197902679443 * t, -4.2375030517578125 * t, 7.476448059082031 * t, 0 * t, .8044459223747253 * t, 0, 0, 0, 1, 0];
                this._loadMatrix(r, e)
            }, i.prototype.lsd = function(t) {
                var e = [2, -.4, .5, 0, 0, -.5, 2, -.4, 0, 0, -.4, -.5, 3, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(e, t)
            }, i.prototype.reset = function() {
                var t = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
                this._loadMatrix(t, !1)
            }, Object.defineProperties(i.prototype, {
                matrix: {
                    get: function() {
                        return this.uniforms.m.value
                    },
                    set: function(t) {
                        this.uniforms.m.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        92: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float step;\n\nvoid main(void)\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n\n    color = floor(color * step) / step;\n\n    gl_FragColor = color;\n}\n", {
                    step: {
                        type: "1f",
                        value: 5
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                step: {
                    get: function() {
                        return this.uniforms.step.value
                    },
                    set: function(t) {
                        this.uniforms.step.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        93: [function(t, e, r) {
            function i(t, e, r) {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying mediump vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec2 texelSize;\nuniform float matrix[9];\n\nvoid main(void)\n{\n   vec4 c11 = texture2D(uSampler, vTextureCoord - texelSize); // top left\n   vec4 c12 = texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y - texelSize.y)); // top center\n   vec4 c13 = texture2D(uSampler, vec2(vTextureCoord.x + texelSize.x, vTextureCoord.y - texelSize.y)); // top right\n\n   vec4 c21 = texture2D(uSampler, vec2(vTextureCoord.x - texelSize.x, vTextureCoord.y)); // mid left\n   vec4 c22 = texture2D(uSampler, vTextureCoord); // mid center\n   vec4 c23 = texture2D(uSampler, vec2(vTextureCoord.x + texelSize.x, vTextureCoord.y)); // mid right\n\n   vec4 c31 = texture2D(uSampler, vec2(vTextureCoord.x - texelSize.x, vTextureCoord.y + texelSize.y)); // bottom left\n   vec4 c32 = texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y + texelSize.y)); // bottom center\n   vec4 c33 = texture2D(uSampler, vTextureCoord + texelSize); // bottom right\n\n   gl_FragColor =\n       c11 * matrix[0] + c12 * matrix[1] + c13 * matrix[2] +\n       c21 * matrix[3] + c22 * matrix[4] + c23 * matrix[5] +\n       c31 * matrix[6] + c32 * matrix[7] + c33 * matrix[8];\n\n   gl_FragColor.a = c22.a;\n}\n", {
                    matrix: {
                        type: "1fv",
                        value: new Float32Array(t)
                    },
                    texelSize: {
                        type: "v2",
                        value: {
                            x: 1 / e,
                            y: 1 / r
                        }
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                matrix: {
                    get: function() {
                        return this.uniforms.matrix.value
                    },
                    set: function(t) {
                        this.uniforms.matrix.value = new Float32Array(t)
                    }
                },
                width: {
                    get: function() {
                        return 1 / this.uniforms.texelSize.value.x
                    },
                    set: function(t) {
                        this.uniforms.texelSize.value.x = 1 / t
                    }
                },
                height: {
                    get: function() {
                        return 1 / this.uniforms.texelSize.value.y
                    },
                    set: function(t) {
                        this.uniforms.texelSize.value.y = 1 / t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        94: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    float lum = length(texture2D(uSampler, vTextureCoord.xy).rgb);\n\n    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n\n    if (lum < 1.00)\n    {\n        if (mod(gl_FragCoord.x + gl_FragCoord.y, 10.0) == 0.0)\n        {\n            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        }\n    }\n\n    if (lum < 0.75)\n    {\n        if (mod(gl_FragCoord.x - gl_FragCoord.y, 10.0) == 0.0)\n        {\n            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        }\n    }\n\n    if (lum < 0.50)\n    {\n        if (mod(gl_FragCoord.x + gl_FragCoord.y - 5.0, 10.0) == 0.0)\n        {\n            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        }\n    }\n\n    if (lum < 0.3)\n    {\n        if (mod(gl_FragCoord.x - gl_FragCoord.y - 5.0, 10.0) == 0.0)\n        {\n            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        }\n    }\n}\n")
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i
        }, {
            "../../core": 27
        }],
        95: [function(t, e, r) {
            function i(t, e) {
                var r = new n.Matrix;
                t.renderable = !1, n.AbstractFilter.call(this, "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMapCoord;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nvoid main(void)\n{\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n   vMapCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n   vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n", "precision mediump float;\n\nvarying vec2 vMapCoord;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform vec2 scale;\n\nuniform sampler2D uSampler;\nuniform sampler2D mapSampler;\n\nvoid main(void)\n{\n   vec4 map =  texture2D(mapSampler, vMapCoord);\n\n   map -= 0.5;\n   map.xy *= scale;\n\n   gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y));\n}\n", {
                    mapSampler: {
                        type: "sampler2D",
                        value: t.texture
                    },
                    otherMatrix: {
                        type: "mat3",
                        value: r.toArray(!0)
                    },
                    scale: {
                        type: "v2",
                        value: {
                            x: 1,
                            y: 1
                        }
                    }
                }), this.maskSprite = t, this.maskMatrix = r, (null === e || void 0 === e) && (e = 20), this.scale = new n.Point(e, e)
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager;
                i.calculateMappedMatrix(e.frame, this.maskSprite, this.maskMatrix), this.uniforms.otherMatrix.value = this.maskMatrix.toArray(!0), this.uniforms.scale.value.x = this.scale.x * (1 / e.frame.width), this.uniforms.scale.value.y = this.scale.y * (1 / e.frame.height);
                var n = this.getShader(t);
                i.applyFilter(n, e, r)
            }, Object.defineProperties(i.prototype, {
                map: {
                    get: function() {
                        return this.uniforms.mapSampler.value
                    },
                    set: function(t) {
                        this.uniforms.mapSampler.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        96: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform vec4 dimensions;\nuniform sampler2D uSampler;\n\nuniform float angle;\nuniform float scale;\n\nfloat pattern()\n{\n   float s = sin(angle), c = cos(angle);\n   vec2 tex = vTextureCoord * dimensions.xy;\n   vec2 point = vec2(\n       c * tex.x - s * tex.y,\n       s * tex.x + c * tex.y\n   ) * scale;\n   return (sin(point.x) * sin(point.y)) * 4.0;\n}\n\nvoid main()\n{\n   vec4 color = texture2D(uSampler, vTextureCoord);\n   float average = (color.r + color.g + color.b) / 3.0;\n   gl_FragColor = vec4(vec3(average * 10.0 - 5.0 + pattern()), color.a);\n}\n", {
                    scale: {
                        type: "1f",
                        value: 1
                    },
                    angle: {
                        type: "1f",
                        value: 5
                    },
                    dimensions: {
                        type: "4fv",
                        value: [0, 0, 0, 0]
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                scale: {
                    get: function() {
                        return this.uniforms.scale.value
                    },
                    set: function(t) {
                        this.uniforms.scale.value = t
                    }
                },
                angle: {
                    get: function() {
                        return this.uniforms.angle.value
                    },
                    set: function(t) {
                        this.uniforms.angle.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        97: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform float strength;\nuniform vec2 offset;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying vec2 vBlurTexCoords[6];\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3((aVertexPosition+offset), 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n\n    vBlurTexCoords[ 0] = aTextureCoord + vec2(0.0, -0.012 * strength);\n    vBlurTexCoords[ 1] = aTextureCoord + vec2(0.0, -0.008 * strength);\n    vBlurTexCoords[ 2] = aTextureCoord + vec2(0.0, -0.004 * strength);\n    vBlurTexCoords[ 3] = aTextureCoord + vec2(0.0,  0.004 * strength);\n    vBlurTexCoords[ 4] = aTextureCoord + vec2(0.0,  0.008 * strength);\n    vBlurTexCoords[ 5] = aTextureCoord + vec2(0.0,  0.012 * strength);\n\n   vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n", "precision lowp float;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vBlurTexCoords[6];\nvarying vec4 vColor;\n\nuniform vec3 color;\nuniform float alpha;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    vec4 sum = vec4(0.0);\n\n    sum += texture2D(uSampler, vBlurTexCoords[ 0])*0.004431848411938341;\n    sum += texture2D(uSampler, vBlurTexCoords[ 1])*0.05399096651318985;\n    sum += texture2D(uSampler, vBlurTexCoords[ 2])*0.2419707245191454;\n    sum += texture2D(uSampler, vTextureCoord     )*0.3989422804014327;\n    sum += texture2D(uSampler, vBlurTexCoords[ 3])*0.2419707245191454;\n    sum += texture2D(uSampler, vBlurTexCoords[ 4])*0.05399096651318985;\n    sum += texture2D(uSampler, vBlurTexCoords[ 5])*0.004431848411938341;\n\n    gl_FragColor = vec4( color.rgb * sum.a * alpha, sum.a * alpha );\n}\n", {
                    blur: {
                        type: "1f",
                        value: 1 / 512
                    },
                    color: {
                        type: "c",
                        value: [0, 0, 0]
                    },
                    alpha: {
                        type: "1f",
                        value: .7
                    },
                    offset: {
                        type: "2f",
                        value: [5, 5]
                    },
                    strength: {
                        type: "1f",
                        value: 1
                    }
                }), this.passes = 1, this.strength = 4
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r, i) {
                var n = this.getShader(t);
                if (this.uniforms.strength.value = this.strength / 4 / this.passes * (e.frame.height / e.size.height), 1 === this.passes) t.filterManager.applyFilter(n, e, r, i);
                else {
                    for (var o = t.filterManager.getRenderTarget(!0), s = e, a = o, h = 0; h < this.passes - 1; h++) {
                        t.filterManager.applyFilter(n, s, a, i);
                        var u = a;
                        a = s, s = u
                    }
                    t.filterManager.applyFilter(n, s, r, i), t.filterManager.returnRenderTarget(o)
                }
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.strength
                    },
                    set: function(t) {
                        this.padding = .5 * t, this.strength = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        98: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this), this.blurXFilter = new o, this.blurYTintFilter = new s, this.defaultFilter = new n.AbstractFilter, this.padding = 30, this._dirtyPosition = !0, this._angle = 45 * Math.PI / 180, this._distance = 10, this.alpha = .75, this.hideObject = !1, this.blendMode = n.BLEND_MODES.MULTIPLY
            }
            var n = t("../../core"),
                o = t("../blur/BlurXFilter"),
                s = t("./BlurYTintFilter");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager.getRenderTarget(!0);
                this._dirtyPosition && (this._dirtyPosition = !1, this.blurYTintFilter.uniforms.offset.value[0] = Math.sin(this._angle) * this._distance, this.blurYTintFilter.uniforms.offset.value[1] = Math.cos(this._angle) * this._distance), this.blurXFilter.applyFilter(t, e, i), t.blendModeManager.setBlendMode(this.blendMode), this.blurYTintFilter.applyFilter(t, i, r), t.blendModeManager.setBlendMode(n.BLEND_MODES.NORMAL), this.hideObject || this.defaultFilter.applyFilter(t, e, r), t.filterManager.returnRenderTarget(i)
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.blurXFilter.blur
                    },
                    set: function(t) {
                        this.blurXFilter.blur = this.blurYTintFilter.blur = t
                    }
                },
                blurX: {
                    get: function() {
                        return this.blurXFilter.blur
                    },
                    set: function(t) {
                        this.blurXFilter.blur = t
                    }
                },
                blurY: {
                    get: function() {
                        return this.blurYTintFilter.blur
                    },
                    set: function(t) {
                        this.blurYTintFilter.blur = t
                    }
                },
                color: {
                    get: function() {
                        return n.utils.rgb2hex(this.blurYTintFilter.uniforms.color.value)
                    },
                    set: function(t) {
                        this.blurYTintFilter.uniforms.color.value = n.utils.hex2rgb(t)
                    }
                },
                alpha: {
                    get: function() {
                        return this.blurYTintFilter.uniforms.alpha.value
                    },
                    set: function(t) {
                        this.blurYTintFilter.uniforms.alpha.value = t
                    }
                },
                distance: {
                    get: function() {
                        return this._distance
                    },
                    set: function(t) {
                        this._dirtyPosition = !0, this._distance = t
                    }
                },
                angle: {
                    get: function() {
                        return this._angle
                    },
                    set: function(t) {
                        this._dirtyPosition = !0, this._angle = t
                    }
                }
            })
        }, {
            "../../core": 27,
            "../blur/BlurXFilter": 88,
            "./BlurYTintFilter": 97
        }],
        99: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\nuniform float gray;\n\nvoid main(void)\n{\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n   gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2126*gl_FragColor.r + 0.7152*gl_FragColor.g + 0.0722*gl_FragColor.b), gray);\n}\n", {
                    gray: {
                        type: "1f",
                        value: 1
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                gray: {
                    get: function() {
                        return this.uniforms.gray.value
                    },
                    set: function(t) {
                        this.uniforms.gray.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        100: [function(t, e, r) {
            e.exports = {
                AsciiFilter: t("./ascii/AsciiFilter"),
                BloomFilter: t("./bloom/BloomFilter"),
                BlurFilter: t("./blur/BlurFilter"),
                BlurXFilter: t("./blur/BlurXFilter"),
                BlurYFilter: t("./blur/BlurYFilter"),
                BlurDirFilter: t("./blur/BlurDirFilter"),
                ColorMatrixFilter: t("./color/ColorMatrixFilter"),
                ColorStepFilter: t("./color/ColorStepFilter"),
                ConvolutionFilter: t("./convolution/ConvolutionFilter"),
                CrossHatchFilter: t("./crosshatch/CrossHatchFilter"),
                DisplacementFilter: t("./displacement/DisplacementFilter"),
                DotScreenFilter: t("./dot/DotScreenFilter"),
                GrayFilter: t("./gray/GrayFilter"),
                DropShadowFilter: t("./dropshadow/DropShadowFilter"),
                InvertFilter: t("./invert/InvertFilter"),
                NoiseFilter: t("./noise/NoiseFilter"),
                PixelateFilter: t("./pixelate/PixelateFilter"),
                RGBSplitFilter: t("./rgb/RGBSplitFilter"),
                ShockwaveFilter: t("./shockwave/ShockwaveFilter"),
                SepiaFilter: t("./sepia/SepiaFilter"),
                SmartBlurFilter: t("./blur/SmartBlurFilter"),
                TiltShiftFilter: t("./tiltshift/TiltShiftFilter"),
                TiltShiftXFilter: t("./tiltshift/TiltShiftXFilter"),
                TiltShiftYFilter: t("./tiltshift/TiltShiftYFilter"),
                TwistFilter: t("./twist/TwistFilter")
            }
        }, {
            "./ascii/AsciiFilter": 84,
            "./bloom/BloomFilter": 85,
            "./blur/BlurDirFilter": 86,
            "./blur/BlurFilter": 87,
            "./blur/BlurXFilter": 88,
            "./blur/BlurYFilter": 89,
            "./blur/SmartBlurFilter": 90,
            "./color/ColorMatrixFilter": 91,
            "./color/ColorStepFilter": 92,
            "./convolution/ConvolutionFilter": 93,
            "./crosshatch/CrossHatchFilter": 94,
            "./displacement/DisplacementFilter": 95,
            "./dot/DotScreenFilter": 96,
            "./dropshadow/DropShadowFilter": 98,
            "./gray/GrayFilter": 99,
            "./invert/InvertFilter": 101,
            "./noise/NoiseFilter": 102,
            "./pixelate/PixelateFilter": 103,
            "./rgb/RGBSplitFilter": 104,
            "./sepia/SepiaFilter": 105,
            "./shockwave/ShockwaveFilter": 106,
            "./tiltshift/TiltShiftFilter": 108,
            "./tiltshift/TiltShiftXFilter": 109,
            "./tiltshift/TiltShiftYFilter": 110,
            "./twist/TwistFilter": 111
        }],
        101: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform float invert;\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    gl_FragColor = texture2D(uSampler, vTextureCoord);\n\n    gl_FragColor.rgb = mix( (vec3(1)-gl_FragColor.rgb) * gl_FragColor.a, gl_FragColor.rgb, 1.0 - invert);\n}\n", {
                    invert: {
                        type: "1f",
                        value: 1
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                invert: {
                    get: function() {
                        return this.uniforms.invert.value
                    },
                    set: function(t) {
                        this.uniforms.invert.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        102: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision highp float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform float noise;\nuniform sampler2D uSampler;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n\n    float diff = (rand(vTextureCoord) - 0.5) * noise;\n\n    color.r += diff;\n    color.g += diff;\n    color.b += diff;\n\n    gl_FragColor = color;\n}\n", {
                    noise: {
                        type: "1f",
                        value: .5
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                noise: {
                    get: function() {
                        return this.uniforms.noise.value
                    },
                    set: function(t) {
                        this.uniforms.noise.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        103: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 dimensions;\nuniform vec2 pixelSize;\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    vec2 coord = vTextureCoord;\n\n    vec2 size = dimensions.xy / pixelSize;\n\n    vec2 color = floor( ( vTextureCoord * size ) ) / size + pixelSize/dimensions.xy * 0.5;\n\n    gl_FragColor = texture2D(uSampler, color);\n}\n", {
                    dimensions: {
                        type: "4fv",
                        value: new Float32Array([0, 0, 0, 0])
                    },
                    pixelSize: {
                        type: "v2",
                        value: {
                            x: 10,
                            y: 10
                        }
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                size: {
                    get: function() {
                        return this.uniforms.pixelSize.value
                    },
                    set: function(t) {
                        this.uniforms.pixelSize.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        104: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec4 dimensions;\nuniform vec2 red;\nuniform vec2 green;\nuniform vec2 blue;\n\nvoid main(void)\n{\n   gl_FragColor.r = texture2D(uSampler, vTextureCoord + red/dimensions.xy).r;\n   gl_FragColor.g = texture2D(uSampler, vTextureCoord + green/dimensions.xy).g;\n   gl_FragColor.b = texture2D(uSampler, vTextureCoord + blue/dimensions.xy).b;\n   gl_FragColor.a = texture2D(uSampler, vTextureCoord).a;\n}\n", {
                    red: {
                        type: "v2",
                        value: {
                            x: 20,
                            y: 20
                        }
                    },
                    green: {
                        type: "v2",
                        value: {
                            x: -20,
                            y: 20
                        }
                    },
                    blue: {
                        type: "v2",
                        value: {
                            x: 20,
                            y: -20
                        }
                    },
                    dimensions: {
                        type: "4fv",
                        value: [0, 0, 0, 0]
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                red: {
                    get: function() {
                        return this.uniforms.red.value
                    },
                    set: function(t) {
                        this.uniforms.red.value = t
                    }
                },
                green: {
                    get: function() {
                        return this.uniforms.green.value
                    },
                    set: function(t) {
                        this.uniforms.green.value = t
                    }
                },
                blue: {
                    get: function() {
                        return this.uniforms.blue.value
                    },
                    set: function(t) {
                        this.uniforms.blue.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        105: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float sepia;\n\nconst mat3 sepiaMatrix = mat3(0.3588, 0.7044, 0.1368, 0.2990, 0.5870, 0.1140, 0.2392, 0.4696, 0.0912);\n\nvoid main(void)\n{\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n   gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * sepiaMatrix, sepia);\n}\n", {
                    sepia: {
                        type: "1f",
                        value: 1
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                sepia: {
                    get: function() {
                        return this.uniforms.sepia.value
                    },
                    set: function(t) {
                        this.uniforms.sepia.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        106: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision lowp float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nuniform vec2 center;\nuniform vec3 params; // 10.0, 0.8, 0.1\nuniform float time;\n\nvoid main()\n{\n    vec2 uv = vTextureCoord;\n    vec2 texCoord = uv;\n\n    float dist = distance(uv, center);\n\n    if ( (dist <= (time + params.z)) && (dist >= (time - params.z)) )\n    {\n        float diff = (dist - time);\n        float powDiff = 1.0 - pow(abs(diff*params.x), params.y);\n\n        float diffTime = diff  * powDiff;\n        vec2 diffUV = normalize(uv - center);\n        texCoord = uv + (diffUV * diffTime);\n    }\n\n    gl_FragColor = texture2D(uSampler, texCoord);\n}\n", {
                    center: {
                        type: "v2",
                        value: {
                            x: .5,
                            y: .5
                        }
                    },
                    params: {
                        type: "v3",
                        value: {
                            x: 10,
                            y: .8,
                            z: .1
                        }
                    },
                    time: {
                        type: "1f",
                        value: 0
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                center: {
                    get: function() {
                        return this.uniforms.center.value
                    },
                    set: function(t) {
                        this.uniforms.center.value = t
                    }
                },
                params: {
                    get: function() {
                        return this.uniforms.params.value
                    },
                    set: function(t) {
                        this.uniforms.params.value = t
                    }
                },
                time: {
                    get: function() {
                        return this.uniforms.time.value
                    },
                    set: function(t) {
                        this.uniforms.time.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        107: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float blur;\nuniform float gradientBlur;\nuniform vec2 start;\nuniform vec2 end;\nuniform vec2 delta;\nuniform vec2 texSize;\n\nfloat random(vec3 scale, float seed)\n{\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\nvoid main(void)\n{\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n    vec2 normal = normalize(vec2(start.y - end.y, end.x - start.x));\n    float radius = smoothstep(0.0, 1.0, abs(dot(vTextureCoord * texSize - start, normal)) / gradientBlur) * blur;\n\n    for (float t = -30.0; t <= 30.0; t++)\n    {\n        float percent = (t + offset - 0.5) / 30.0;\n        float weight = 1.0 - abs(percent);\n        vec4 sample = texture2D(uSampler, vTextureCoord + delta / texSize * percent * radius);\n        sample.rgb *= sample.a;\n        color += sample * weight;\n        total += weight;\n    }\n\n    gl_FragColor = color / total;\n    gl_FragColor.rgb /= gl_FragColor.a + 0.00001;\n}\n", {
                    blur: {
                        type: "1f",
                        value: 100
                    },
                    gradientBlur: {
                        type: "1f",
                        value: 600
                    },
                    start: {
                        type: "v2",
                        value: {
                            x: 0,
                            y: window.innerHeight / 2
                        }
                    },
                    end: {
                        type: "v2",
                        value: {
                            x: 600,
                            y: window.innerHeight / 2
                        }
                    },
                    delta: {
                        type: "v2",
                        value: {
                            x: 30,
                            y: 30
                        }
                    },
                    texSize: {
                        type: "v2",
                        value: {
                            x: window.innerWidth,
                            y: window.innerHeight
                        }
                    }
                }), this.updateDelta()
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.updateDelta = function() {
                this.uniforms.delta.value.x = 0, this.uniforms.delta.value.y = 0
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.uniforms.blur.value
                    },
                    set: function(t) {
                        this.uniforms.blur.value = t
                    }
                },
                gradientBlur: {
                    get: function() {
                        return this.uniforms.gradientBlur.value
                    },
                    set: function(t) {
                        this.uniforms.gradientBlur.value = t
                    }
                },
                start: {
                    get: function() {
                        return this.uniforms.start.value
                    },
                    set: function(t) {
                        this.uniforms.start.value = t, this.updateDelta()
                    }
                },
                end: {
                    get: function() {
                        return this.uniforms.end.value
                    },
                    set: function(t) {
                        this.uniforms.end.value = t, this.updateDelta()
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        108: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this), this.tiltShiftXFilter = new o, this.tiltShiftYFilter = new s
            }
            var n = t("../../core"),
                o = t("./TiltShiftXFilter"),
                s = t("./TiltShiftYFilter");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.applyFilter = function(t, e, r) {
                var i = t.filterManager.getRenderTarget(!0);
                this.tiltShiftXFilter.applyFilter(t, e, i), this.tiltShiftYFilter.applyFilter(t, i, r), t.filterManager.returnRenderTarget(i)
            }, Object.defineProperties(i.prototype, {
                blur: {
                    get: function() {
                        return this.tiltShiftXFilter.blur
                    },
                    set: function(t) {
                        this.tiltShiftXFilter.blur = this.tiltShiftYFilter.blur = t
                    }
                },
                gradientBlur: {
                    get: function() {
                        return this.tiltShiftXFilter.gradientBlur
                    },
                    set: function(t) {
                        this.tiltShiftXFilter.gradientBlur = this.tiltShiftYFilter.gradientBlur = t
                    }
                },
                start: {
                    get: function() {
                        return this.tiltShiftXFilter.start
                    },
                    set: function(t) {
                        this.tiltShiftXFilter.start = this.tiltShiftYFilter.start = t
                    }
                },
                end: {
                    get: function() {
                        return this.tiltShiftXFilter.end
                    },
                    set: function(t) {
                        this.tiltShiftXFilter.end = this.tiltShiftYFilter.end = t
                    }
                }
            })
        }, {
            "../../core": 27,
            "./TiltShiftXFilter": 109,
            "./TiltShiftYFilter": 110
        }],
        109: [function(t, e, r) {
            function i() {
                n.call(this)
            }
            var n = t("./TiltShiftAxisFilter");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.updateDelta = function() {
                var t = this.uniforms.end.value.x - this.uniforms.start.value.x,
                    e = this.uniforms.end.value.y - this.uniforms.start.value.y,
                    r = Math.sqrt(t * t + e * e);
                this.uniforms.delta.value.x = t / r, this.uniforms.delta.value.y = e / r
            }
        }, {
            "./TiltShiftAxisFilter": 107
        }],
        110: [function(t, e, r) {
            function i() {
                n.call(this)
            }
            var n = t("./TiltShiftAxisFilter");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.updateDelta = function() {
                var t = this.uniforms.end.value.x - this.uniforms.start.value.x,
                    e = this.uniforms.end.value.y - this.uniforms.start.value.y,
                    r = Math.sqrt(t * t + e * e);
                this.uniforms.delta.value.x = -e / r, this.uniforms.delta.value.y = t / r
            }
        }, {
            "./TiltShiftAxisFilter": 107
        }],
        111: [function(t, e, r) {
            function i() {
                n.AbstractFilter.call(this, null, "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float radius;\nuniform float angle;\nuniform vec2 offset;\n\nvoid main(void)\n{\n   vec2 coord = vTextureCoord - offset;\n   float dist = length(coord);\n\n   if (dist < radius)\n   {\n       float ratio = (radius - dist) / radius;\n       float angleMod = ratio * ratio * angle;\n       float s = sin(angleMod);\n       float c = cos(angleMod);\n       coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);\n   }\n\n   gl_FragColor = texture2D(uSampler, coord+offset);\n}\n", {
                    radius: {
                        type: "1f",
                        value: .5
                    },
                    angle: {
                        type: "1f",
                        value: 5
                    },
                    offset: {
                        type: "v2",
                        value: {
                            x: .5,
                            y: .5
                        }
                    }
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.AbstractFilter.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                offset: {
                    get: function() {
                        return this.uniforms.offset.value
                    },
                    set: function(t) {
                        this.uniforms.offset.value = t
                    }
                },
                radius: {
                    get: function() {
                        return this.uniforms.radius.value
                    },
                    set: function(t) {
                        this.uniforms.radius.value = t
                    }
                },
                angle: {
                    get: function() {
                        return this.uniforms.angle.value
                    },
                    set: function(t) {
                        this.uniforms.angle.value = t
                    }
                }
            })
        }, {
            "../../core": 27
        }],
        112: [function(t, e, r) {
            (function(r) {
                t("./polyfill");
                var i = e.exports = t("./core");
                i.extras = t("./extras"), i.filters = t("./filters"), i.interaction = t("./interaction"), i.loaders = t("./loaders"), i.mesh = t("./mesh"), i.loader = new i.loaders.Loader, Object.assign(i, t("./deprecation")), r.PIXI = i
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "./core": 27,
            "./deprecation": 76,
            "./extras": 83,
            "./filters": 100,
            "./interaction": 115,
            "./loaders": 118,
            "./mesh": 124,
            "./polyfill": 129
        }],
        113: [function(t, e, r) {
            function i() {
                this.global = new n.Point, this.target = null, this.originalEvent = null
            }
            var n = t("../core");
            i.prototype.constructor = i, e.exports = i, i.prototype.getLocalPosition = function(t, e, r) {
                return t.toLocal(r ? r : this.global, e)
            }
        }, {
            "../core": 27
        }],
        114: [function(t, e, r) {
            function i(t, e) {
                e = e || {}, this.renderer = t, this.autoPreventDefault = void 0 !== e.autoPreventDefault ? e.autoPreventDefault : !0, this.interactionFrequency = e.interactionFrequency || 10, this.mouse = new o, this.eventData = {
                    stopped: !1,
                    target: null,
                    type: null,
                    data: this.mouse,
                    stopPropagation: function() {
                        this.stopped = !0
                    }
                }, this.interactiveDataPool = [], this.interactionDOMElement = null, this.eventsAdded = !1, this.onMouseUp = this.onMouseUp.bind(this), this.processMouseUp = this.processMouseUp.bind(this), this.onMouseDown = this.onMouseDown.bind(this), this.processMouseDown = this.processMouseDown.bind(this), this.onMouseMove = this.onMouseMove.bind(this), this.processMouseMove = this.processMouseMove.bind(this), this.onMouseOut = this.onMouseOut.bind(this), this.processMouseOverOut = this.processMouseOverOut.bind(this), this.onTouchStart = this.onTouchStart.bind(this), this.processTouchStart = this.processTouchStart.bind(this), this.onTouchEnd = this.onTouchEnd.bind(this), this.processTouchEnd = this.processTouchEnd.bind(this), this.onTouchMove = this.onTouchMove.bind(this), this.processTouchMove = this.processTouchMove.bind(this), this.last = 0, this.currentCursorStyle = "inherit", this._tempPoint = new n.Point, this.resolution = 1, this.setTargetElement(this.renderer.view, this.renderer.resolution)
            }
            var n = t("../core"),
                o = t("./InteractionData");
            Object.assign(n.DisplayObject.prototype, t("./interactiveTarget")), i.prototype.constructor = i, e.exports = i, i.prototype.setTargetElement = function(t, e) {
                this.removeEvents(), this.interactionDOMElement = t, this.resolution = e || 1, this.addEvents()
            }, i.prototype.addEvents = function() {
                this.interactionDOMElement && (n.ticker.shared.add(this.update, this), window.navigator.msPointerEnabled && (this.interactionDOMElement.style["-ms-content-zooming"] = "none", this.interactionDOMElement.style["-ms-touch-action"] = "none"), window.document.addEventListener("mousemove", this.onMouseMove, !0), this.interactionDOMElement.addEventListener("mousedown", this.onMouseDown, !0), this.interactionDOMElement.addEventListener("mouseout", this.onMouseOut, !0), this.interactionDOMElement.addEventListener("touchstart", this.onTouchStart, !0), this.interactionDOMElement.addEventListener("touchend", this.onTouchEnd, !0), this.interactionDOMElement.addEventListener("touchmove", this.onTouchMove, !0), window.addEventListener("mouseup", this.onMouseUp, !0), this.eventsAdded = !0)
            }, i.prototype.removeEvents = function() {
                this.interactionDOMElement && (n.ticker.shared.remove(this.update), window.navigator.msPointerEnabled && (this.interactionDOMElement.style["-ms-content-zooming"] = "", this.interactionDOMElement.style["-ms-touch-action"] = ""), window.document.removeEventListener("mousemove", this.onMouseMove, !0), this.interactionDOMElement.removeEventListener("mousedown", this.onMouseDown, !0), this.interactionDOMElement.removeEventListener("mouseout", this.onMouseOut, !0), this.interactionDOMElement.removeEventListener("touchstart", this.onTouchStart, !0), this.interactionDOMElement.removeEventListener("touchend", this.onTouchEnd, !0), this.interactionDOMElement.removeEventListener("touchmove", this.onTouchMove, !0), this.interactionDOMElement = null, window.removeEventListener("mouseup", this.onMouseUp, !0), this.eventsAdded = !1)
            }, i.prototype.update = function(t) {
                if (this._deltaTime += t, !(this._deltaTime < this.interactionFrequency) && (this._deltaTime = 0, this.interactionDOMElement)) {
                    if (this.didMove) return void(this.didMove = !1);
                    this.cursor = "inherit", this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseOverOut, !0), this.currentCursorStyle !== this.cursor && (this.currentCursorStyle = this.cursor, this.interactionDOMElement.style.cursor = this.cursor)
                }
            }, i.prototype.dispatchEvent = function(t, e, r) {
                r.stopped || (r.target = t, r.type = e, t.emit(e, r), t[e] && t[e](r))
            }, i.prototype.mapPositionToPoint = function(t, e, r) {
                var i = this.interactionDOMElement.getBoundingClientRect();
                t.x = (e - i.left) * (this.interactionDOMElement.width / i.width) / this.resolution, t.y = (r - i.top) * (this.interactionDOMElement.height / i.height) / this.resolution
            }, i.prototype.processInteractive = function(t, e, r, i, n) {
                if (!e || !e.visible) return !1;
                var o = e.children,
                    s = !1;
                if (n = n || e.interactive, e.interactiveChildren)
                    for (var a = o.length - 1; a >= 0; a--) !s && i ? s = this.processInteractive(t, o[a], r, !0, n) : this.processInteractive(t, o[a], r, !1, !1);
                return n && (i && (e.hitArea ? (e.worldTransform.applyInverse(t, this._tempPoint), s = e.hitArea.contains(this._tempPoint.x, this._tempPoint.y)) : e.containsPoint && (s = e.containsPoint(t))), e.interactive && r(e, s)), s
            }, i.prototype.onMouseDown = function(t) {
                this.mouse.originalEvent = t, this.eventData.data = this.mouse, this.eventData.stopped = !1, this.mapPositionToPoint(this.mouse.global, t.clientX, t.clientY), this.autoPreventDefault && this.mouse.originalEvent.preventDefault(), this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseDown, !0)
            }, i.prototype.processMouseDown = function(t, e) {
                var r = this.mouse.originalEvent,
                    i = 2 === r.button || 3 === r.which;
                e && (t[i ? "_isRightDown" : "_isLeftDown"] = !0, this.dispatchEvent(t, i ? "rightdown" : "mousedown", this.eventData))
            }, i.prototype.onMouseUp = function(t) {
                this.mouse.originalEvent = t, this.eventData.data = this.mouse, this.eventData.stopped = !1, this.mapPositionToPoint(this.mouse.global, t.clientX, t.clientY), this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseUp, !0)
            }, i.prototype.processMouseUp = function(t, e) {
                var r = this.mouse.originalEvent,
                    i = 2 === r.button || 3 === r.which,
                    n = i ? "_isRightDown" : "_isLeftDown";
                e ? (this.dispatchEvent(t, i ? "rightup" : "mouseup", this.eventData), t[n] && (t[n] = !1, this.dispatchEvent(t, i ? "rightclick" : "click", this.eventData))) : t[n] && (t[n] = !1, this.dispatchEvent(t, i ? "rightupoutside" : "mouseupoutside", this.eventData))
            }, i.prototype.onMouseMove = function(t) {
                this.mouse.originalEvent = t, this.eventData.data = this.mouse, this.eventData.stopped = !1, this.mapPositionToPoint(this.mouse.global, t.clientX, t.clientY), this.didMove = !0, this.cursor = "inherit", this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseMove, !0), this.currentCursorStyle !== this.cursor && (this.currentCursorStyle = this.cursor, this.interactionDOMElement.style.cursor = this.cursor)
            }, i.prototype.processMouseMove = function(t, e) {
                this.dispatchEvent(t, "mousemove", this.eventData), this.processMouseOverOut(t, e)
            }, i.prototype.onMouseOut = function(t) {
                this.mouse.originalEvent = t, this.eventData.stopped = !1, this.mapPositionToPoint(this.mouse.global, t.clientX, t.clientY), this.interactionDOMElement.style.cursor = "inherit", this.mapPositionToPoint(this.mouse.global, t.clientX, t.clientY), this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseOverOut, !1)
            }, i.prototype.processMouseOverOut = function(t, e) {
                e ? (t._over || (t._over = !0, this.dispatchEvent(t, "mouseover", this.eventData)), t.buttonMode && (this.cursor = t.defaultCursor)) : t._over && (t._over = !1, this.dispatchEvent(t, "mouseout", this.eventData))
            }, i.prototype.onTouchStart = function(t) {
                this.autoPreventDefault && t.preventDefault();
                for (var e = t.changedTouches, r = e.length, i = 0; r > i; i++) {
                    var n = e[i],
                        o = this.getTouchData(n);
                    o.originalEvent = t, this.eventData.data = o, this.eventData.stopped = !1, this.processInteractive(o.global, this.renderer._lastObjectRendered, this.processTouchStart, !0), this.returnTouchData(o)
                }
            }, i.prototype.processTouchStart = function(t, e) {
                e && (t._touchDown = !0, this.dispatchEvent(t, "touchstart", this.eventData))
            }, i.prototype.onTouchEnd = function(t) {
                this.autoPreventDefault && t.preventDefault();
                for (var e = t.changedTouches, r = e.length, i = 0; r > i; i++) {
                    var n = e[i],
                        o = this.getTouchData(n);
                    o.originalEvent = t, this.eventData.data = o, this.eventData.stopped = !1, this.processInteractive(o.global, this.renderer._lastObjectRendered, this.processTouchEnd, !0), this.returnTouchData(o)
                }
            }, i.prototype.processTouchEnd = function(t, e) {
                e ? (this.dispatchEvent(t, "touchend", this.eventData), t._touchDown && (t._touchDown = !1, this.dispatchEvent(t, "tap", this.eventData))) : t._touchDown && (t._touchDown = !1, this.dispatchEvent(t, "touchendoutside", this.eventData))
            }, i.prototype.onTouchMove = function(t) {
                this.autoPreventDefault && t.preventDefault();
                for (var e = t.changedTouches, r = e.length, i = 0; r > i; i++) {
                    var n = e[i],
                        o = this.getTouchData(n);
                    o.originalEvent = t, this.eventData.data = o, this.eventData.stopped = !1, this.processInteractive(o.global, this.renderer._lastObjectRendered, this.processTouchMove, !0), this.returnTouchData(o)
                }
            }, i.prototype.processTouchMove = function(t, e) {
                e = e, this.dispatchEvent(t, "touchmove", this.eventData)
            }, i.prototype.getTouchData = function(t) {
                var e = this.interactiveDataPool.pop();
                return e || (e = new o), e.identifier = t.identifier, this.mapPositionToPoint(e.global, t.clientX, t.clientY), navigator.isCocoonJS && (e.global.x = e.global.x / this.resolution, e.global.y = e.global.y / this.resolution), t.globalX = e.global.x, t.globalY = e.global.y, e
            }, i.prototype.returnTouchData = function(t) {
                this.interactiveDataPool.push(t)
            }, i.prototype.destroy = function() {
                this.removeEvents(), this.renderer = null, this.mouse = null, this.eventData = null, this.interactiveDataPool = null, this.interactionDOMElement = null, this.onMouseUp = null, this.processMouseUp = null, this.onMouseDown = null, this.processMouseDown = null, this.onMouseMove = null, this.processMouseMove = null, this.onMouseOut = null, this.processMouseOverOut = null, this.onTouchStart = null, this.processTouchStart = null, this.onTouchEnd = null, this.processTouchEnd = null, this.onTouchMove = null, this.processTouchMove = null, this._tempPoint = null
            }, n.WebGLRenderer.registerPlugin("interaction", i), n.CanvasRenderer.registerPlugin("interaction", i)
        }, {
            "../core": 27,
            "./InteractionData": 113,
            "./interactiveTarget": 116
        }],
        115: [function(t, e, r) {
            e.exports = {
                InteractionData: t("./InteractionData"),
                InteractionManager: t("./InteractionManager"),
                interactiveTarget: t("./interactiveTarget")
            }
        }, {
            "./InteractionData": 113,
            "./InteractionManager": 114,
            "./interactiveTarget": 116
        }],
        116: [function(t, e, r) {
            var i = {
                interactive: !1,
                buttonMode: !1,
                interactiveChildren: !0,
                defaultCursor: "pointer",
                _over: !1,
                _touchDown: !1
            };
            e.exports = i
        }, {}],
        117: [function(t, e, r) {
            function i(t, e) {
                var r = {},
                    i = t.data.getElementsByTagName("info")[0],
                    n = t.data.getElementsByTagName("common")[0];
                r.font = i.getAttribute("face"), r.size = parseInt(i.getAttribute("size"), 10), r.lineHeight = parseInt(n.getAttribute("lineHeight"), 10), r.chars = {};
                for (var a = t.data.getElementsByTagName("char"), h = 0; h < a.length; h++) {
                    var u = parseInt(a[h].getAttribute("id"), 10),
                        l = new o.Rectangle(parseInt(a[h].getAttribute("x"), 10) + e.frame.x, parseInt(a[h].getAttribute("y"), 10) + e.frame.y, parseInt(a[h].getAttribute("width"), 10), parseInt(a[h].getAttribute("height"), 10));
                    r.chars[u] = {
                        xOffset: parseInt(a[h].getAttribute("xoffset"), 10),
                        yOffset: parseInt(a[h].getAttribute("yoffset"), 10),
                        xAdvance: parseInt(a[h].getAttribute("xadvance"), 10),
                        kerning: {},
                        texture: new o.Texture(e.baseTexture, l)
                    }
                }
                var c = t.data.getElementsByTagName("kerning");
                for (h = 0; h < c.length; h++) {
                    var p = parseInt(c[h].getAttribute("first"), 10),
                        d = parseInt(c[h].getAttribute("second"), 10),
                        f = parseInt(c[h].getAttribute("amount"), 10);
                    r.chars[d].kerning[p] = f
                }
                t.bitmapFont = r, s.BitmapText.fonts[r.font] = r
            }
            var n = t("resource-loader").Resource,
                o = t("../core"),
                s = t("../extras"),
                a = t("path");
            e.exports = function() {
                return function(t, e) {
                    if (!t.data || !t.isXml) return e();
                    if (0 === t.data.getElementsByTagName("page").length || 0 === t.data.getElementsByTagName("info").length || null === t.data.getElementsByTagName("info")[0].getAttribute("face")) return e();
                    var r = a.dirname(t.url);
                    "." === r && (r = ""), this.baseUrl && r && ("/" === this.baseUrl.charAt(this.baseUrl.length - 1) && (r += "/"), r = r.replace(this.baseUrl, "")), r && "/" !== r.charAt(r.length - 1) && (r += "/");
                    var s = r + t.data.getElementsByTagName("page")[0].getAttribute("file");
                    if (o.utils.TextureCache[s]) i(t, o.utils.TextureCache[s]), e();
                    else {
                        var h = {
                            crossOrigin: t.crossOrigin,
                            loadType: n.LOAD_TYPE.IMAGE
                        };
                        this.add(t.name + "_image", s, h, function(r) {
                            i(t, r.texture), e()
                        })
                    }
                }
            }
        }, {
            "../core": 27,
            "../extras": 83,
            path: 2,
            "resource-loader": 16
        }],
        118: [function(t, e, r) {
            e.exports = {
                Loader: t("./loader"),
                bitmapFontParser: t("./bitmapFontParser"),
                spritesheetParser: t("./spritesheetParser"),
                textureParser: t("./textureParser"),
                Resource: t("resource-loader").Resource
            }
        }, {
            "./bitmapFontParser": 117,
            "./loader": 119,
            "./spritesheetParser": 120,
            "./textureParser": 121,
            "resource-loader": 16
        }],
        119: [function(t, e, r) {
            function i(t, e) {
                n.call(this, t, e);
                for (var r = 0; r < i._pixiMiddleware.length; ++r) this.use(i._pixiMiddleware[r]())
            }
            var n = t("resource-loader"),
                o = t("./textureParser"),
                s = t("./spritesheetParser"),
                a = t("./bitmapFontParser");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i._pixiMiddleware = [n.middleware.parsing.blob, o, s, a], i.addPixiMiddleware = function(t) {
                i._pixiMiddleware.push(t)
            };
            var h = n.Resource;
            h.setExtensionXhrType("fnt", h.XHR_RESPONSE_TYPE.DOCUMENT)
        }, {
            "./bitmapFontParser": 117,
            "./spritesheetParser": 120,
            "./textureParser": 121,
            "resource-loader": 16
        }],
        120: [function(t, e, r) {
            var i = t("resource-loader").Resource,
                n = t("path"),
                o = t("../core");
            e.exports = function() {
                return function(t, e) {
                    if (!t.data || !t.isJson || !t.data.frames) return e();
                    var r = {
                            crossOrigin: t.crossOrigin,
                            loadType: i.LOAD_TYPE.IMAGE
                        },
                        s = n.dirname(t.url.replace(this.baseUrl, "")),
                        a = o.utils.getResolutionOfUrl(t.url);
                    this.add(t.name + "_image", s + "/" + t.data.meta.image, r, function(r) {
                        t.textures = {};
                        var i = t.data.frames;
                        for (var n in i) {
                            var s = i[n].frame;
                            if (s) {
                                var h = null,
                                    u = null;
                                if (h = i[n].rotated ? new o.Rectangle(s.x, s.y, s.h, s.w) : new o.Rectangle(s.x, s.y, s.w, s.h), i[n].trimmed && (u = new o.Rectangle(i[n].spriteSourceSize.x / a, i[n].spriteSourceSize.y / a, i[n].sourceSize.w / a, i[n].sourceSize.h / a)), i[n].rotated) {
                                    var l = h.width;
                                    h.width = h.height, h.height = l
                                }
                                h.x /= a, h.y /= a, h.width /= a, h.height /= a, t.textures[n] = new o.Texture(r.texture.baseTexture, h, h.clone(), u, i[n].rotated), o.utils.TextureCache[n] = t.textures[n]
                            }
                        }
                        e()
                    })
                }
            }
        }, {
            "../core": 27,
            path: 2,
            "resource-loader": 16
        }],
        121: [function(t, e, r) {
            var i = t("../core");
            e.exports = function() {
                return function(t, e) {
                    if (t.data && t.isImage) {
                        var r = new i.BaseTexture(t.data, null, i.utils.getResolutionOfUrl(t.url));
                        r.imageUrl = t.url, t.texture = new i.Texture(r), i.utils.BaseTextureCache[t.url] = r, i.utils.TextureCache[t.url] = t.texture
                    }
                    e()
                }
            }
        }, {
            "../core": 27
        }],
        122: [function(t, e, r) {
            function i(t, e, r, o, s) {
                n.Container.call(this), this._texture = null, this.uvs = r || new Float32Array([0, 1, 1, 1, 1, 0, 0, 1]), this.vertices = e || new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]), this.indices = o || new Uint16Array([0, 1, 2, 3]), this.dirty = !0, this.blendMode = n.BLEND_MODES.NORMAL, this.canvasPadding = 0, this.drawMode = s || i.DRAW_MODES.TRIANGLE_MESH, this.texture = t
            }
            var n = t("../core"),
                o = new n.Point,
                s = new n.Polygon;
            i.prototype = Object.create(n.Container.prototype), i.prototype.constructor = i, e.exports = i, Object.defineProperties(i.prototype, {
                texture: {
                    get: function() {
                        return this._texture
                    },
                    set: function(t) {
                        this._texture !== t && (this._texture = t, t && (t.baseTexture.hasLoaded ? this._onTextureUpdate() : t.once("update", this._onTextureUpdate, this)))
                    }
                }
            }), i.prototype._renderWebGL = function(t) {
                t.setObjectRenderer(t.plugins.mesh), t.plugins.mesh.render(this)
            }, i.prototype._renderCanvas = function(t) {
                var e = t.context,
                    r = this.worldTransform;
                t.roundPixels ? e.setTransform(r.a, r.b, r.c, r.d, 0 | r.tx, 0 | r.ty) : e.setTransform(r.a, r.b, r.c, r.d, r.tx, r.ty), this.drawMode === i.DRAW_MODES.TRIANGLE_MESH ? this._renderCanvasTriangleMesh(e) : this._renderCanvasTriangles(e)
            }, i.prototype._renderCanvasTriangleMesh = function(t) {
                for (var e = this.vertices, r = this.uvs, i = e.length / 2, n = 0; i - 2 > n; n++) {
                    var o = 2 * n;
                    this._renderCanvasDrawTriangle(t, e, r, o, o + 2, o + 4)
                }
            }, i.prototype._renderCanvasTriangles = function(t) {
                for (var e = this.vertices, r = this.uvs, i = this.indices, n = i.length, o = 0; n > o; o += 3) {
                    var s = 2 * i[o],
                        a = 2 * i[o + 1],
                        h = 2 * i[o + 2];
                    this._renderCanvasDrawTriangle(t, e, r, s, a, h)
                }
            }, i.prototype._renderCanvasDrawTriangle = function(t, e, r, i, n, o) {
                var s = this._texture.baseTexture.source,
                    a = this._texture.baseTexture.width,
                    h = this._texture.baseTexture.height,
                    u = e[i],
                    l = e[n],
                    c = e[o],
                    p = e[i + 1],
                    d = e[n + 1],
                    f = e[o + 1],
                    v = r[i] * a,
                    g = r[n] * a,
                    m = r[o] * a,
                    y = r[i + 1] * h,
                    x = r[n + 1] * h,
                    b = r[o + 1] * h;
                if (this.canvasPadding > 0) {
                    var _ = this.canvasPadding / this.worldTransform.a,
                        T = this.canvasPadding / this.worldTransform.d,
                        E = (u + l + c) / 3,
                        S = (p + d + f) / 3,
                        w = u - E,
                        A = p - S,
                        C = Math.sqrt(w * w + A * A);
                    u = E + w / C * (C + _), p = S + A / C * (C + T), w = l - E, A = d - S, C = Math.sqrt(w * w + A * A), l = E + w / C * (C + _), d = S + A / C * (C + T), w = c - E, A = f - S, C = Math.sqrt(w * w + A * A), c = E + w / C * (C + _), f = S + A / C * (C + T)
                }
                t.save(), t.beginPath(), t.moveTo(u, p), t.lineTo(l, d), t.lineTo(c, f), t.closePath(), t.clip();
                var R = v * x + y * m + g * b - x * m - y * g - v * b,
                    M = u * x + y * c + l * b - x * c - y * l - u * b,
                    O = v * l + u * m + g * c - l * m - u * g - v * c,
                    P = v * x * c + y * l * m + u * g * b - u * x * m - y * g * c - v * l * b,
                    F = p * x + y * f + d * b - x * f - y * d - p * b,
                    D = v * d + p * m + g * f - d * m - p * g - v * f,
                    B = v * x * f + y * d * m + p * g * b - p * x * m - y * g * f - v * d * b;
                t.transform(M / R, F / R, O / R, D / R, P / R, B / R), t.drawImage(s, 0, 0), t.restore()
            }, i.prototype.renderMeshFlat = function(t) {
                var e = this.context,
                    r = t.vertices,
                    i = r.length / 2;
                e.beginPath();
                for (var n = 1; i - 2 > n; n++) {
                    var o = 2 * n,
                        s = r[o],
                        a = r[o + 2],
                        h = r[o + 4],
                        u = r[o + 1],
                        l = r[o + 3],
                        c = r[o + 5];
                    e.moveTo(s, u), e.lineTo(a, l), e.lineTo(h, c)
                }
                e.fillStyle = "#FF0000", e.fill(), e.closePath()
            }, i.prototype._onTextureUpdate = function() {
                this.updateFrame = !0
            }, i.prototype.getBounds = function(t) {
                if (!this._currentBounds) {
                    for (var e = t || this.worldTransform, r = e.a, i = e.b, o = e.c, s = e.d, a = e.tx, h = e.ty, u = -(1 / 0), l = -(1 / 0), c = 1 / 0, p = 1 / 0, d = this.vertices, f = 0, v = d.length; v > f; f += 2) {
                        var g = d[f],
                            m = d[f + 1],
                            y = r * g + o * m + a,
                            x = s * m + i * g + h;
                        c = c > y ? y : c, p = p > x ? x : p, u = y > u ? y : u, l = x > l ? x : l
                    }
                    if (c === -(1 / 0) || l === 1 / 0) return n.Rectangle.EMPTY;
                    var b = this._bounds;
                    b.x = c, b.width = u - c, b.y = p, b.height = l - p, this._currentBounds = b
                }
                return this._currentBounds
            }, i.prototype.containsPoint = function(t) {
                if (!this.getBounds().contains(t.x, t.y)) return !1;
                this.worldTransform.applyInverse(t, o);
                var e, r, n = this.vertices,
                    a = s.points;
                if (this.drawMode === i.DRAW_MODES.TRIANGLES) {
                    var h = this.indices;
                    for (r = this.indices.length, e = 0; r > e; e += 3) {
                        var u = 2 * h[e],
                            l = 2 * h[e + 1],
                            c = 2 * h[e + 2];
                        if (a[0] = n[u], a[1] = n[u + 1], a[2] = n[l], a[3] = n[l + 1], a[4] = n[c], a[5] = n[c + 1], s.contains(o.x, o.y)) return !0
                    }
                } else
                    for (r = n.length, e = 0; r > e; e += 6)
                        if (a[0] = n[e], a[1] = n[e + 1], a[2] = n[e + 2], a[3] = n[e + 3], a[4] = n[e + 4], a[5] = n[e + 5], s.contains(o.x, o.y)) return !0; return !1
            }, i.DRAW_MODES = {
                TRIANGLE_MESH: 0,
                TRIANGLES: 1
            }
        }, {
            "../core": 27
        }],
        123: [function(t, e, r) {
            function i(t, e) {
                n.call(this, t), this.points = e, this.vertices = new Float32Array(4 * e.length), this.uvs = new Float32Array(4 * e.length), this.colors = new Float32Array(2 * e.length), this.indices = new Uint16Array(2 * e.length), this._ready = !0, this.refresh()
            }
            var n = t("./Mesh"),
                o = t("../core");
            i.prototype = Object.create(n.prototype), i.prototype.constructor = i, e.exports = i, i.prototype.refresh = function() {
                var t = this.points;
                if (!(t.length < 1) && this._texture._uvs) {
                    var e = this.uvs,
                        r = this.indices,
                        i = this.colors,
                        n = this._texture._uvs,
                        s = new o.Point(n.x0, n.y0),
                        a = new o.Point(n.x2 - n.x0, n.y2 - n.y0);
                    e[0] = 0 + s.x, e[1] = 0 + s.y, e[2] = 0 + s.x, e[3] = 1 * a.y + s.y, i[0] = 1, i[1] = 1, r[0] = 0, r[1] = 1;
                    for (var h, u, l, c = t.length, p = 1; c > p; p++) h = t[p], u = 4 * p, l = p / (c - 1), e[u] = l * a.x + s.x, e[u + 1] = 0 + s.y, e[u + 2] = l * a.x + s.x, e[u + 3] = 1 * a.y + s.y, u = 2 * p, i[u] = 1, i[u + 1] = 1, u = 2 * p, r[u] = u, r[u + 1] = u + 1;
                    this.dirty = !0
                }
            }, i.prototype._onTextureUpdate = function() {
                n.prototype._onTextureUpdate.call(this), this._ready && this.refresh()
            }, i.prototype.updateTransform = function() {
                var t = this.points;
                if (!(t.length < 1)) {
                    for (var e, r, i, n, o, s, a = t[0], h = 0, u = 0, l = this.vertices, c = t.length, p = 0; c > p; p++) r = t[p], i = 4 * p, e = p < t.length - 1 ? t[p + 1] : r, u = -(e.x - a.x), h = e.y - a.y, n = 10 * (1 - p / (c - 1)), n > 1 && (n = 1), o = Math.sqrt(h * h + u * u), s = this._texture.height / 2, h /= o, u /= o, h *= s, u *= s, l[i] = r.x + h, l[i + 1] = r.y + u, l[i + 2] = r.x - h, l[i + 3] = r.y - u, a = r;
                    this.containerUpdateTransform()
                }
            }
        }, {
            "../core": 27,
            "./Mesh": 122
        }],
        124: [function(t, e, r) {
            e.exports = {
                Mesh: t("./Mesh"),
                Rope: t("./Rope"),
                MeshRenderer: t("./webgl/MeshRenderer"),
                MeshShader: t("./webgl/MeshShader")
            }
        }, {
            "./Mesh": 122,
            "./Rope": 123,
            "./webgl/MeshRenderer": 125,
            "./webgl/MeshShader": 126
        }],
        125: [function(t, e, r) {
            function i(t) {
                n.ObjectRenderer.call(this, t), this.indices = new Uint16Array(15e3);
                for (var e = 0, r = 0; 15e3 > e; e += 6, r += 4) this.indices[e + 0] = r + 0, this.indices[e + 1] = r + 1, this.indices[e + 2] = r + 2, this.indices[e + 3] = r + 0, this.indices[e + 4] = r + 2, this.indices[e + 5] = r + 3
            }
            var n = t("../../core"),
                o = t("../Mesh");
            i.prototype = Object.create(n.ObjectRenderer.prototype), i.prototype.constructor = i, e.exports = i, n.WebGLRenderer.registerPlugin("mesh", i), i.prototype.onContextChange = function() {}, i.prototype.render = function(t) {
                t._vertexBuffer || this._initWebGL(t);
                var e = this.renderer,
                    r = e.gl,
                    i = t._texture.baseTexture,
                    n = e.shaderManager.plugins.meshShader,
                    s = t.drawMode === o.DRAW_MODES.TRIANGLE_MESH ? r.TRIANGLE_STRIP : r.TRIANGLES;
                e.blendModeManager.setBlendMode(t.blendMode), r.uniformMatrix3fv(n.uniforms.translationMatrix._location, !1, t.worldTransform.toArray(!0)), r.uniformMatrix3fv(n.uniforms.projectionMatrix._location, !1, e.currentRenderTarget.projectionMatrix.toArray(!0)), r.uniform1f(n.uniforms.alpha._location, t.worldAlpha), t.dirty ? (t.dirty = !1, r.bindBuffer(r.ARRAY_BUFFER, t._vertexBuffer), r.bufferData(r.ARRAY_BUFFER, t.vertices, r.STATIC_DRAW), r.vertexAttribPointer(n.attributes.aVertexPosition, 2, r.FLOAT, !1, 0, 0), r.bindBuffer(r.ARRAY_BUFFER, t._uvBuffer), r.bufferData(r.ARRAY_BUFFER, t.uvs, r.STATIC_DRAW), r.vertexAttribPointer(n.attributes.aTextureCoord, 2, r.FLOAT, !1, 0, 0), r.activeTexture(r.TEXTURE0), i._glTextures[r.id] ? r.bindTexture(r.TEXTURE_2D, i._glTextures[r.id]) : this.renderer.updateTexture(i), r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, t._indexBuffer), r.bufferData(r.ELEMENT_ARRAY_BUFFER, t.indices, r.STATIC_DRAW)) : (r.bindBuffer(r.ARRAY_BUFFER, t._vertexBuffer), r.bufferSubData(r.ARRAY_BUFFER, 0, t.vertices), r.vertexAttribPointer(n.attributes.aVertexPosition, 2, r.FLOAT, !1, 0, 0), r.bindBuffer(r.ARRAY_BUFFER, t._uvBuffer), r.vertexAttribPointer(n.attributes.aTextureCoord, 2, r.FLOAT, !1, 0, 0), r.activeTexture(r.TEXTURE0), i._glTextures[r.id] ? r.bindTexture(r.TEXTURE_2D, i._glTextures[r.id]) : this.renderer.updateTexture(i), r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, t._indexBuffer), r.bufferSubData(r.ELEMENT_ARRAY_BUFFER, 0, t.indices)), r.drawElements(s, t.indices.length, r.UNSIGNED_SHORT, 0)
            }, i.prototype._initWebGL = function(t) {
                var e = this.renderer.gl;
                t._vertexBuffer = e.createBuffer(), t._indexBuffer = e.createBuffer(), t._uvBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, t._vertexBuffer), e.bufferData(e.ARRAY_BUFFER, t.vertices, e.DYNAMIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, t._uvBuffer), e.bufferData(e.ARRAY_BUFFER, t.uvs, e.STATIC_DRAW), t.colors && (t._colorBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, t._colorBuffer), e.bufferData(e.ARRAY_BUFFER, t.colors, e.STATIC_DRAW)), e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, t._indexBuffer), e.bufferData(e.ELEMENT_ARRAY_BUFFER, t.indices, e.STATIC_DRAW)
            }, i.prototype.flush = function() {}, i.prototype.start = function() {
                var t = this.renderer.shaderManager.plugins.meshShader;
                this.renderer.shaderManager.setShader(t)
            }, i.prototype.destroy = function() {
                n.ObjectRenderer.prototype.destroy.call(this)
            }
        }, {
            "../../core": 27,
            "../Mesh": 122
        }],
        126: [function(t, e, r) {
            function i(t) {
                n.Shader.call(this, t, ["precision lowp float;", "attribute vec2 aVertexPosition;", "attribute vec2 aTextureCoord;", "uniform mat3 translationMatrix;", "uniform mat3 projectionMatrix;", "varying vec2 vTextureCoord;", "void main(void){", "   gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);", "   vTextureCoord = aTextureCoord;", "}"].join("\n"), ["precision lowp float;", "varying vec2 vTextureCoord;", "uniform float alpha;", "uniform sampler2D uSampler;", "void main(void){", "   gl_FragColor = texture2D(uSampler, vTextureCoord) * alpha ;", "}"].join("\n"), {
                    alpha: {
                        type: "1f",
                        value: 0
                    },
                    translationMatrix: {
                        type: "mat3",
                        value: new Float32Array(9)
                    },
                    projectionMatrix: {
                        type: "mat3",
                        value: new Float32Array(9)
                    }
                }, {
                    aVertexPosition: 0,
                    aTextureCoord: 0
                })
            }
            var n = t("../../core");
            i.prototype = Object.create(n.Shader.prototype), i.prototype.constructor = i, e.exports = i, n.ShaderManager.registerPlugin("meshShader", i)
        }, {
            "../../core": 27
        }],
        127: [function(t, e, r) {
            Math.sign || (Math.sign = function(t) {
                return t = +t, 0 === t || isNaN(t) ? t : t > 0 ? 1 : -1
            })
        }, {}],
        128: [function(t, e, r) {
            Object.assign || (Object.assign = t("object-assign"))
        }, {
            "object-assign": 11
        }],
        129: [function(t, e, r) {
            t("./Object.assign"), t("./requestAnimationFrame"), t("./Math.sign")
        }, {
            "./Math.sign": 127,
            "./Object.assign": 128,
            "./requestAnimationFrame": 130
        }],
        130: [function(t, e, r) {
            (function(t) {
                if (Date.now && Date.prototype.getTime || (Date.now = function() {
                        return (new Date).getTime()
                    }), !t.performance || !t.performance.now) {
                    var e = Date.now();
                    t.performance || (t.performance = {}), t.performance.now = function() {
                        return Date.now() - e
                    }
                }
                for (var r = Date.now(), i = ["ms", "moz", "webkit", "o"], n = 0; n < i.length && !t.requestAnimationFrame; ++n) t.requestAnimationFrame = t[i[n] + "RequestAnimationFrame"], t.cancelAnimationFrame = t[i[n] + "CancelAnimationFrame"] || t[i[n] + "CancelRequestAnimationFrame"];
                t.requestAnimationFrame || (t.requestAnimationFrame = function(t) {
                    if ("function" != typeof t) throw new TypeError(t + "is not a function");
                    var e = Date.now(),
                        i = 16 + r - e;
                    return 0 > i && (i = 0), r = e, setTimeout(function() {
                        r = Date.now(), t(performance.now())
                    }, i)
                }), t.cancelAnimationFrame || (t.cancelAnimationFrame = function(t) {
                    clearTimeout(t)
                })
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {}]
    }, {}, [112])(112)
});
gdjs.PixiFiltersTools = function() {};
gdjs.NightPixiFilter = function() {
    var vertexShader = null;
    var fragmentShader = ["precision mediump float;", "", "varying vec2 vTextureCoord;", "uniform sampler2D uSampler;", "uniform float intensity;", "uniform float opacity;", "", "void main(void)", "{", "   mat3 nightMatrix = mat3(-2.0 * intensity, -1.0 * intensity, 0, -1.0 * intensity, 0, 1.0 * intensity, 0, 1.0 * intensity, 2.0 * intensity);", "   gl_FragColor = texture2D(uSampler, vTextureCoord);", "   gl_FragColor.rgb = mix(gl_FragColor.rgb, nightMatrix * gl_FragColor.rgb, opacity);", "}"].join("\n");
    var uniforms = {
        intensity: {
            type: "1f",
            value: 1
        },
        opacity: {
            type: "1f",
            value: 1
        }
    };
    PIXI.AbstractFilter.call(this, vertexShader, fragmentShader, uniforms)
};
gdjs.NightPixiFilter.prototype = Object.create(PIXI.AbstractFilter.prototype);
gdjs.NightPixiFilter.prototype.constructor = gdjs.NightPixiFilter;
gdjs.LightNightPixiFilter = function() {
    var vertexShader = null;
    var fragmentShader = ["precision mediump float;", "", "varying vec2 vTextureCoord;", "uniform sampler2D uSampler;", "uniform float opacity;", "", "void main(void)", "{", "   mat3 nightMatrix = mat3(0.6, 0, 0, 0, 0.7, 0, 0, 0, 1.3);", "   gl_FragColor = texture2D(uSampler, vTextureCoord);", "   gl_FragColor.rgb = mix(gl_FragColor.rgb, nightMatrix * gl_FragColor.rgb, opacity);", "}"].join("\n");
    var uniforms = {
        opacity: {
            type: "1f",
            value: 1
        }
    };
    PIXI.AbstractFilter.call(this, vertexShader, fragmentShader, uniforms)
};
gdjs.LightNightPixiFilter.prototype = Object.create(PIXI.AbstractFilter.prototype);
gdjs.LightNightPixiFilter.prototype.constructor = gdjs.LightNightPixiFilter;
gdjs.PixiFiltersTools._filters = {
    Night: {
        makeFilter: function() {
            var filter = new gdjs.NightPixiFilter;
            return filter
        },
        updateParameter: function(filter, parameterName, value) {
            if (parameterName !== "intensity" && parameterName !== "opacity") return;
            filter.uniforms[parameterName].value = value
        }
    },
    LightNight: {
        makeFilter: function() {
            var filter = new gdjs.LightNightPixiFilter;
            return filter
        },
        updateParameter: function(filter, parameterName, value) {
            if (parameterName !== "opacity") return;
            filter.uniforms.opacity.value = value
        }
    },
    Sepia: {
        makeFilter: function() {
            return new PIXI.filters.SepiaFilter
        },
        updateParameter: function(filter, parameterName, value) {
            if (parameterName !== "opacity") return;
            filter.sepia = value
        }
    }
};
gdjs.PixiFiltersTools.getFilter = function(filterName) {
    if (gdjs.PixiFiltersTools._filters.hasOwnProperty(filterName)) return gdjs.PixiFiltersTools._filters[filterName];
    return null
};
gdjs.RuntimeGamePixiRenderer = function(game, width, height, forceFullscreen) {
    this._game = game;
    this._isFullscreen = true;
    this._forceFullscreen = forceFullscreen;
    this._pixiRenderer = null;
    this._canvasArea = null;
    this._currentWidth = width;
    this._currentHeight = height;
    this._keepRatio = true;
    this._reduceIfNeed = true;
    this._marginLeft = this._marginTop = this._marginRight = this._marginBottom = 0;
    if (navigator.isCocoonJS && !this._forceFullscreen) {
        this._forceFullscreen = true;
        console.log("Forcing fullscreen for CocoonJS.")
    }
    if (typeof intel != "undefined") {
        this._forceFullscreen = true;
        console.log("Forcing fullscreen for Intel XDK.")
    }
};
gdjs.RuntimeGameRenderer = gdjs.RuntimeGamePixiRenderer;
gdjs.RuntimeGamePixiRenderer.prototype.createStandardCanvas = function(canvasArea) {
    this._canvasArea = canvasArea;
    this._pixiRenderer = PIXI.autoDetectRenderer(this._game.getDefaultWidth(), this._game.getDefaultHeight());
    canvasArea.style["position"] = "absolute";
    canvasArea.appendChild(this._pixiRenderer.view);
    canvasArea.tabindex = "1";
    canvasArea.style.overflow = "hidden";
    this.resize();
    var that = this;
    window.addEventListener("resize", function() {
        that.resize();
        that._game._notifySceneForResize = true
    });
    return this._pixiRenderer
};
gdjs.RuntimeGamePixiRenderer.prototype.getCurrentWidth = function() {
    return this._currentWidth
};
gdjs.RuntimeGamePixiRenderer.prototype.getCurrentHeight = function() {
    return this._currentHeight
};
gdjs.RuntimeGamePixiRenderer.prototype.setSize = function(width, height) {
    this._currentWidth = width;
    this._currentHeight = height;
    this.resize();
    this._game._notifySceneForResize = true
};
gdjs.RuntimeGamePixiRenderer.prototype.resize = function() {
    var keepRatio = this._keepRatio;
    var reduceIfNeed = this._reduceIfNeed;
    var isFullscreen = this._forceFullscreen || this._isFullscreen;
    var width = this.getCurrentWidth();
    var height = this.getCurrentHeight();
    var marginLeft = this._marginLeft;
    var marginTop = this._marginTop;
    var marginRight = this._marginRight;
    var marginBottom = this._marginBottom;
    var maxWidth = window.innerWidth - marginLeft - marginRight;
    var maxHeight = window.innerHeight - marginTop - marginBottom;
    if (maxWidth < 0) maxWidth = 0;
    if (maxHeight < 0) maxHeight = 0;
    if (isFullscreen && !keepRatio) {
        width = maxWidth;
        height = maxHeight
    } else if (isFullscreen && keepRatio || reduceIfNeed && (width > maxWidth || height > maxHeight)) {
        var factor = maxWidth / width;
        if (height * factor > maxHeight) factor = maxHeight / height;
        width *= factor;
        height *= factor
    }
    if (this._pixiRenderer.width !== width || this._pixiRenderer.height !== height) this._pixiRenderer.resize(width, height);
    this._canvasArea.style["top"] = marginTop + (maxHeight - height) / 2 + "px";
    this._canvasArea.style["left"] = marginLeft + (maxWidth - width) / 2 + "px";
    this._canvasArea.style.width = width + "px";
    this._canvasArea.style.height = height + "px"
};
gdjs.RuntimeGamePixiRenderer.prototype.keepAspectRatio = function(enable) {
    if (this._keepRatio === enable) return;
    this._keepRatio = enable;
    this.resize();
    this._game._notifySceneForResize = true
};
gdjs.RuntimeGamePixiRenderer.prototype.setMargins = function(top, right, bottom, left) {
    if (this._marginTop === top && this._marginRight === right && this._marginBottom === bottom && this._marginLeft === left) return;
    this._marginTop = top;
    this._marginRight = right;
    this._marginBottom = bottom;
    this._marginLeft = left;
    this.resize();
    this._game._notifySceneForResize = true
};
gdjs.RuntimeGamePixiRenderer.prototype.setFullScreen = function(enable) {
    if (this._forceFullscreen) return;
    if (this._isFullscreen !== enable) {
        this._isFullscreen = !!enable;
        this.resize();
        this._notifySceneForResize = true;
        if (this._isFullscreen) {
            if (document.documentElement.requestFullScreen) {
                document.documentElement.requestFullScreen()
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen()
            } else if (document.documentElement.webkitRequestFullScreen) {
                document.documentElement.webkitRequestFullScreen()
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen()
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen()
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen()
            }
        }
    }
};
gdjs.RuntimeGamePixiRenderer.prototype.bindStandardEvents = function(manager, window, document) {
    var renderer = this._pixiRenderer;
    var canvasArea = this._canvasArea;
    var that = this;

    function getEventPosition(e) {
        var pos = [0, 0];
        if (e.pageX) {
            pos[0] = e.pageX - canvasArea.offsetLeft;
            pos[1] = e.pageY - canvasArea.offsetTop
        } else {
            pos[0] = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - canvasArea.offsetLeft;
            pos[1] = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvasArea.offsetTop
        }
        pos[0] *= that._game.getDefaultWidth() / renderer.view.width;
        pos[1] *= that._game.getDefaultHeight() / renderer.view.height;
        return pos
    }(function ensureOffsetsExistence() {
        if (isNaN(canvasArea.offsetLeft)) {
            canvasArea.offsetLeft = 0;
            canvasArea.offsetTop = 0
        }
        if (isNaN(document.body.scrollLeft)) {
            document.body.scrollLeft = 0;
            document.body.scrollTop = 0
        }
        if (document.documentElement === undefined || document.documentElement === null) {
            document.documentElement = {}
        }
        if (isNaN(document.documentElement.scrollLeft)) {
            document.documentElement.scrollLeft = 0;
            document.documentElement.scrollTop = 0
        }
        if (isNaN(canvasArea.offsetLeft)) {
            canvasArea.offsetLeft = 0;
            canvasArea.offsetTop = 0
        }
    })();
    document.onkeydown = function(e) {
        manager.onKeyPressed(e.keyCode)
    };
    document.onkeyup = function(e) {
        manager.onKeyReleased(e.keyCode)
    };
    renderer.view.onmousemove = function(e) {
        var pos = getEventPosition(e);
        manager.onMouseMove(pos[0], pos[1])
    };
    renderer.view.onmousedown = function(e) {
        manager.onMouseButtonPressed(e.button === 2 ? 1 : 0);
        if (window.focus !== undefined) window.focus();
        return false
    };
    renderer.view.onmouseup = function(e) {
        manager.onMouseButtonReleased(e.button === 2 ? 1 : 0);
        return false
    };
    renderer.view.onmouseout = function(e) {
        manager.onMouseButtonReleased(0);
        manager.onMouseButtonReleased(1);
        manager.onMouseWheel(0);
        return false
    };
    window.addEventListener("click", function(e) {
        if (window.focus !== undefined) window.focus();
        e.preventDefault();
        return false
    }, false);
    renderer.view.oncontextmenu = function(event) {
        event.preventDefault();
        event.stopPropagation();
        return false
    };
    renderer.view.onmousewheel = function(event) {
        manager.onMouseWheel(event.wheelDelta)
    };
    window.addEventListener("touchmove", function(e) {
        e.preventDefault();
        if (e.changedTouches) {
            for (var i = 0; i < e.changedTouches.length; ++i) {
                var pos = getEventPosition(e.changedTouches[i]);
                manager.onTouchMove(e.changedTouches[i].identifier, pos[0], pos[1])
            }
        }
    });
    window.addEventListener("touchstart", function(e) {
        e.preventDefault();
        if (e.changedTouches) {
            for (var i = 0; i < e.changedTouches.length; ++i) {
                var pos = getEventPosition(e.changedTouches[i]);
                manager.onTouchStart(e.changedTouches[i].identifier, pos[0], pos[1])
            }
        }
        return false
    });
    window.addEventListener("touchend", function(e) {
        e.preventDefault();
        if (e.changedTouches) {
            for (var i = 0; i < e.changedTouches.length; ++i) {
                var pos = getEventPosition(e.changedTouches[i]);
                manager.onTouchEnd(e.changedTouches[i].identifier)
            }
        }
        return false
    })
};
gdjs.RuntimeGamePixiRenderer.prototype.setWindowTitle = function(title) {
    if (typeof document !== "undefined") document.title = title
};
gdjs.RuntimeGamePixiRenderer.prototype.getWindowTitle = function() {
    return typeof document !== "undefined" ? document.title : ""
};
gdjs.RuntimeGamePixiRenderer.prototype.startGameLoop = function(fn) {
    requestAnimationFrame(gameLoop);
    var oldTime = null;

    function gameLoop(time) {
        var dt = oldTime ? time - oldTime : 0;
        oldTime = time;
        if (fn(dt)) requestAnimationFrame(gameLoop)
    }
};
gdjs.RuntimeGamePixiRenderer.prototype.getPIXIRenderer = function() {
    return this._pixiRenderer
};
gdjs.RuntimeScenePixiRenderer = function(runtimeScene, runtimeGameRenderer) {
    this._pixiRenderer = runtimeGameRenderer ? runtimeGameRenderer.getPIXIRenderer() : null;
    this._runtimeScene = runtimeScene;
    this._pixiContainer = new PIXI.Container
};
gdjs.RuntimeSceneRenderer = gdjs.RuntimeScenePixiRenderer;
gdjs.RuntimeScenePixiRenderer.prototype.onCanvasResized = function() {
    if (!this._pixiRenderer) return;
    var runtimeGame = this._runtimeScene.getGame();
    this._pixiContainer.scale.x = this._pixiRenderer.width / runtimeGame.getDefaultWidth();
    this._pixiContainer.scale.y = this._pixiRenderer.height / runtimeGame.getDefaultHeight()
};
gdjs.RuntimeScenePixiRenderer.prototype.render = function() {
    if (!this._pixiRenderer) return;
    this._pixiRenderer.backgroundColor = this._runtimeScene.getBackgroundColor();
    this._pixiRenderer.render(this._pixiContainer)
};
gdjs.RuntimeScenePixiRenderer.prototype._renderProfileText = function() {
    if (!this._profilerText) {
        this._profilerText = new PIXI.Text(" ", {
            align: "left",
            stroke: "#FFF",
            strokeThickness: 1
        });
        this._pixiContainer.addChild(this._profilerText)
    }
    var average = this._runtimeScene._profiler.getAverage();
    var total = Object.keys(average).reduce(function(sum, key) {
        return sum + (key !== "total" ? average[key] : 0)
    }, 0);
    var text = "";
    for (var p in average) {
        text += p + ": " + average[p].toFixed(2) + "ms" + "(" + (average[p] / total * 100).toFixed(1) + "%)\n"
    }
    this._profilerText.text = text
};
gdjs.RuntimeScenePixiRenderer.prototype.hideCursor = function() {
    this._pixiRenderer.view.style.cursor = "none"
};
gdjs.RuntimeScenePixiRenderer.prototype.showCursor = function() {
    this._pixiRenderer.view.style.cursor = ""
};
gdjs.RuntimeScenePixiRenderer.prototype.getPIXIContainer = function() {
    return this._pixiContainer
};
gdjs.LayerPixiRenderer = function(layer, runtimeSceneRenderer) {
    this._pixiContainer = new PIXI.Container;
    this._layer = layer;
    runtimeSceneRenderer.getPIXIContainer().addChild(this._pixiContainer);
    this._addFilters()
};
gdjs.LayerRenderer = gdjs.LayerPixiRenderer;
gdjs.LayerPixiRenderer.prototype.updatePosition = function() {
    var angle = -gdjs.toRad(this._layer.getCameraRotation());
    var zoomFactor = this._layer.getCameraZoom();
    this._pixiContainer.rotation = angle;
    this._pixiContainer.scale.x = zoomFactor;
    this._pixiContainer.scale.y = zoomFactor;
    var centerX = this._layer.getCameraX() * zoomFactor * Math.cos(angle) - this._layer.getCameraY() * zoomFactor * Math.sin(angle);
    var centerY = this._layer.getCameraX() * zoomFactor * Math.sin(angle) + this._layer.getCameraY() * zoomFactor * Math.cos(angle);
    this._pixiContainer.position.x = -centerX;
    this._pixiContainer.position.y = -centerY;
    this._pixiContainer.position.x += this._layer.getWidth() / 2;
    this._pixiContainer.position.y += this._layer.getHeight() / 2
};
gdjs.LayerPixiRenderer.prototype.updateVisibility = function(visible) {
    this._pixiContainer.visible = !!visible
};
gdjs.LayerPixiRenderer.prototype._addFilters = function() {
    var effects = this._layer.getEffects();
    if (effects.length === 0) {
        return
    } else if (effects.length > 1) {
        console.log("Only a single effect by Layer is supported for now by the Pixi renderer")
    }
    var filter = gdjs.PixiFiltersTools.getFilter(effects[0].effectName);
    if (!filter) {
        console.log('Filter "' + effects[0].name + '" not found');
        return
    }
    var theFilter = {
        filter: filter.makeFilter(),
        updateParameter: filter.updateParameter
    };
    this._pixiContainer.filters = [theFilter.filter];
    this._filters = {};
    this._filters[effects[0].name] = theFilter
};
gdjs.LayerPixiRenderer.prototype.addRendererObject = function(child, zOrder) {
    child.zOrder = zOrder;
    for (var i = 0, len = this._pixiContainer.children.length; i < len; ++i) {
        if (this._pixiContainer.children[i].zOrder >= zOrder) {
            this._pixiContainer.addChildAt(child, i);
            return
        }
    }
    this._pixiContainer.addChild(child)
};
gdjs.LayerPixiRenderer.prototype.changeRendererObjectZOrder = function(child, newZOrder) {
    this._pixiContainer.removeChild(child);
    this.addRendererObject(child, newZOrder)
};
gdjs.LayerPixiRenderer.prototype.removeRendererObject = function(child) {
    this._pixiContainer.removeChild(child)
};
gdjs.LayerPixiRenderer.prototype.setEffectParameter = function(name, parameterName, value) {
    if (!this._filters.hasOwnProperty(name)) return;
    var theFilter = this._filters[name];
    theFilter.updateParameter(theFilter.filter, parameterName, value)
};
gdjs.PixiImageManager = function(resources) {
    this._resources = resources;
    this._invalidTexture = PIXI.Texture.fromImage("bunny.png");
    this._loadedTextures = new Hashtable
};
gdjs.ImageManager = gdjs.PixiImageManager;
gdjs.PixiImageManager.prototype.getPIXITexture = function(name) {
    if (this._loadedTextures.containsKey(name)) {
        return this._loadedTextures.get(name)
    }
    if (name === "") {
        return this._invalidTexture
    }
    if (this._resources) {
        var texture = null;
        for (var i = 0, len = this._resources.length; i < len; ++i) {
            var res = this._resources[i];
            if (res.name === name && res.kind === "image") {
                texture = PIXI.Texture.fromImage(res.file);
                break
            }
        }
        if (texture !== null) {
            console.log('Loaded texture "' + name + '".');
            this._loadedTextures.put(name, texture);
            return texture
        }
    }
    console.warn('Unable to find texture "' + name + '".');
    return this._invalidTexture
};
gdjs.PixiImageManager.prototype.getInvalidPIXITexture = function() {
    return this._invalidTexture
};
gdjs.PixiImageManager.prototype.loadTextures = function(onProgress, onComplete, resources) {
    resources = resources || this._resources;
    var files = {};
    for (var i = 0, len = resources.length; i < len; ++i) {
        var res = resources[i];
        if (res.file && res.kind === "image") {
            if (this._loadedTextures.containsKey(res.name)) {
                console.log('Texture "' + res.name + '" is already loaded.');
                continue
            }
            files[res.file] = files[res.file] ? files[res.file].concat(res) : [res]
        }
    }
    var totalCount = Object.keys(files).length;
    if (totalCount === 0) return onComplete();
    var loadingCount = 0;
    var loader = PIXI.loader;
    var that = this;
    loader.once("complete", function(loader, loadedFiles) {
        for (var file in loadedFiles) {
            if (loadedFiles.hasOwnProperty(file)) {
                if (!files.hasOwnProperty(file)) continue;
                files[file].forEach(function(res) {
                    that._loadedTextures.put(res.name, loadedFiles[file].texture);
                    if (!res.smoothed) {
                        loadedFiles[file].texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
                    }
                })
            }
        }
        onComplete()
    });
    loader.on("progress", function() {
        loadingCount++;
        onProgress(loadingCount, totalCount)
    });
    for (var file in files) {
        if (files.hasOwnProperty(file)) {
            loader.add(file, file)
        }
    }
    loader.load()
};
gdjs.SpriteRuntimeObjectPixiRenderer = function(runtimeObject, runtimeScene) {
    this._object = runtimeObject;
    this._spriteDirty = true;
    this._textureDirty = true;
    if (this._sprite === undefined) this._sprite = new PIXI.Sprite(runtimeScene.getGame().getImageManager().getInvalidPIXITexture());
    var layer = runtimeScene.getLayer("");
    if (layer) layer.getRenderer().addRendererObject(this._sprite, runtimeObject.getZOrder())
};
gdjs.SpriteRuntimeObjectRenderer = gdjs.SpriteRuntimeObjectPixiRenderer;
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.getRendererObject = function() {
    return this._sprite
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype._updatePIXISprite = function() {
    if (this._object._animationFrame !== null) {
        this._sprite.anchor.x = this._object._animationFrame.center.x / this._sprite.texture.frame.width;
        this._sprite.anchor.y = this._object._animationFrame.center.y / this._sprite.texture.frame.height;
        this._sprite.position.x = this._object.x + (this._object._animationFrame.center.x - this._object._animationFrame.origin.x) * Math.abs(this._object._scaleX);
        this._sprite.position.y = this._object.y + (this._object._animationFrame.center.y - this._object._animationFrame.origin.y) * Math.abs(this._object._scaleY);
        if (this._object._flippedX) this._sprite.position.x += (this._sprite.texture.frame.width / 2 - this._object._animationFrame.center.x) * Math.abs(this._object._scaleX) * 2;
        if (this._object._flippedY) this._sprite.position.y += (this._sprite.texture.frame.height / 2 - this._object._animationFrame.center.y) * Math.abs(this._object._scaleY) * 2;
        this._sprite.rotation = gdjs.toRad(this._object.angle);
        this._sprite.visible = !this._object.hidden;
        this._sprite.blendMode = this._object._blendMode;
        this._sprite.alpha = this._sprite.visible ? this._object.opacity / 255 : 0;
        this._sprite.scale.x = this._object._scaleX;
        this._sprite.scale.y = this._object._scaleY;
        this._cachedWidth = Math.abs(this._sprite.width);
        this._cachedHeight = Math.abs(this._sprite.height)
    } else {
        this._sprite.visible = false;
        this._sprite.alpha = 0;
        this._cachedWidth = 0;
        this._cachedHeight = 0
    }
    this._spriteDirty = false
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.ensureUpToDate = function() {
    if (this._spriteDirty) this._updatePIXISprite()
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.updateFrame = function(animationFrame) {
    this._spriteDirty = true;
    this._sprite.texture = animationFrame.texture
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.update = function() {
    this._spriteDirty = true
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.updateX = function() {
    this._sprite.position.x = this._object.x + (this._object._animationFrame.center.x - this._object._animationFrame.origin.x) * Math.abs(this._object._scaleX);
    if (this._flippedX) this._sprite.position.x += (this._sprite.texture.frame.width / 2 - this._object._animationFrame.center.x) * Math.abs(this._object._scaleX) * 2
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.updateY = function() {
    this._sprite.position.y = this._object.y + (this._object._animationFrame.center.y - this._object._animationFrame.origin.y) * Math.abs(this._object._scaleY);
    if (this._flippedY) this._sprite.position.y += (this._sprite.texture.frame.height / 2 - this._object._animationFrame.center.y) * Math.abs(this._object._scaleY) * 2
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.updateAngle = function() {
    this._sprite.rotation = gdjs.toRad(this._object.angle)
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.updateOpacity = function() {
    this._sprite.alpha = this._sprite.visible ? this._object.opacity / 255 : 0
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.updateVisibility = function() {
    this._sprite.visible = !this._object.hidden;
    this._sprite.alpha = this._sprite.visible ? this._object.opacity / 255 : 0
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.setColor = function(rgbColor) {
    var colors = rgbColor.split(";");
    if (colors.length < 3) return;
    this._sprite.tint = "0x" + gdjs.rgbToHex(parseInt(colors[0]), parseInt(colors[1]), parseInt(colors[2]))
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.getWidth = function() {
    if (this._spriteDirty) this._updatePIXISprite();
    return this._cachedWidth
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.getHeight = function() {
    if (this._spriteDirty) this._updatePIXISprite();
    return this._cachedHeight
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.getUnscaledWidth = function() {
    return this._sprite.texture.frame.width
};
gdjs.SpriteRuntimeObjectPixiRenderer.prototype.getUnscaledHeight = function() {
    return this._sprite.texture.frame.height
};
gdjs.SpriteRuntimeObjectPixiRenderer.getAnimationFrame = function(imageManager, imageName) {
    return imageManager.getPIXITexture(imageName)
};
gdjs.SpriteRuntimeObjectPixiRenderer.getAnimationFrameWidth = function(pixiTexture) {
    return pixiTexture.width
};
gdjs.SpriteRuntimeObjectPixiRenderer.getAnimationFrameHeight = function(pixiTexture) {
    return pixiTexture.height
};
gdjs.LoadingScreenPixiRenderer = function(runtimeGamePixiRenderer) {
    this._pixiRenderer = runtimeGamePixiRenderer.getPIXIRenderer();
    this._loadingScreen = new PIXI.Container;
    this._text = new PIXI.Text(" ", {
        font: "bold 60px Arial",
        fill: "#FFFFFF",
        align: "center"
    });
    this._loadingScreen.addChild(this._text);
    this._text.position.y = this._pixiRenderer.height / 2
};
gdjs.LoadingScreenRenderer = gdjs.LoadingScreenPixiRenderer;
gdjs.LoadingScreenPixiRenderer.prototype.render = function(percent) {
    this._text.text = percent + "%";
    this._text.position.x = this._pixiRenderer.width / 2 - this._text.width / 2;
    this._pixiRenderer.render(this._loadingScreen)
};
! function() {
    "use strict";
    var e = function() {
        this.init()
    };
    e.prototype = {
        init: function() {
            var e = this || n;
            return e._codecs = {}, e._howls = [], e._muted = !1, e._volume = 1, e._canPlayEvent = "canplaythrough", e._navigator = "undefined" != typeof window && window.navigator ? window.navigator : null, e.masterGain = null, e.noAudio = !1, e.usingWebAudio = !0, e.autoSuspend = !0, e.ctx = null, e.mobileAutoEnable = !0, e._setup(), e
        },
        volume: function(e) {
            var o = this || n;
            if (e = parseFloat(e), o.ctx || _(), "undefined" != typeof e && e >= 0 && e <= 1) {
                if (o._volume = e, o._muted) return o;
                o.usingWebAudio && (o.masterGain.gain.value = e);
                for (var t = 0; t < o._howls.length; t++)
                    if (!o._howls[t]._webAudio)
                        for (var r = o._howls[t]._getSoundIds(), u = 0; u < r.length; u++) {
                            var a = o._howls[t]._soundById(r[u]);
                            a && a._node && (a._node.volume = a._volume * e)
                        }
                    return o
            }
            return o._volume
        },
        mute: function(e) {
            var o = this || n;
            o.ctx || _(), o._muted = e, o.usingWebAudio && (o.masterGain.gain.value = e ? 0 : o._volume);
            for (var t = 0; t < o._howls.length; t++)
                if (!o._howls[t]._webAudio)
                    for (var r = o._howls[t]._getSoundIds(), u = 0; u < r.length; u++) {
                        var a = o._howls[t]._soundById(r[u]);
                        a && a._node && (a._node.muted = !!e || a._muted)
                    }
                return o
        },
        unload: function() {
            for (var e = this || n, o = e._howls.length - 1; o >= 0; o--) e._howls[o].unload();
            return e.usingWebAudio && "undefined" != typeof e.ctx.close && (e.ctx.close(), e.ctx = null, _()), e
        },
        codecs: function(e) {
            return (this || n)._codecs[e]
        },
        _setup: function() {
            var e = this || n;
            return e.state = e.ctx ? e.ctx.state || "running" : "running", e._autoSuspend(), e.noAudio || e._setupCodecs(), e
        },
        _setupCodecs: function() {
            var e = this || n,
                o = "undefined" != typeof Audio ? new Audio : null;
            if (!o || "function" != typeof o.canPlayType) return e;
            var t = o.canPlayType("audio/mpeg;").replace(/^no$/, ""),
                r = e._navigator && e._navigator.userAgent.match(/OPR\/([0-6].)/g),
                u = r && parseInt(r[0].split("/")[1], 10) < 33;
            return e._codecs = {
                mp3: !(u || !t && !o.canPlayType("audio/mp3;").replace(/^no$/, "")),
                mpeg: !!t,
                opus: !!o.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
                ogg: !!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
                oga: !!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
                wav: !!o.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ""),
                aac: !!o.canPlayType("audio/aac;").replace(/^no$/, ""),
                caf: !!o.canPlayType("audio/x-caf;").replace(/^no$/, ""),
                m4a: !!(o.canPlayType("audio/x-m4a;") || o.canPlayType("audio/m4a;") || o.canPlayType("audio/aac;")).replace(/^no$/, ""),
                mp4: !!(o.canPlayType("audio/x-mp4;") || o.canPlayType("audio/mp4;") || o.canPlayType("audio/aac;")).replace(/^no$/, ""),
                weba: !!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ""),
                webm: !!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ""),
                dolby: !!o.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, "")
            }, e
        },
        _enableMobileAudio: function() {
            var e = this || n,
                o = /iPhone|iPad|iPod|Android|BlackBerry|BB10|Silk|Mobi/i.test(e._navigator && e._navigator.userAgent),
                t = !!("ontouchend" in window || e._navigator && e._navigator.maxTouchPoints > 0 || e._navigator && e._navigator.msMaxTouchPoints > 0);
            if (!e._mobileEnabled && e.ctx && (o || t)) {
                e._mobileEnabled = !1, e._mobileUnloaded || 44100 === e.ctx.sampleRate || (e._mobileUnloaded = !0, e.unload()), e._scratchBuffer = e.ctx.createBuffer(1, 1, 22050);
                var r = function() {
                    var n = e.ctx.createBufferSource();
                    n.buffer = e._scratchBuffer, n.connect(e.ctx.destination), "undefined" == typeof n.start ? n.noteOn(0) : n.start(0), n.onended = function() {
                        n.disconnect(0), e._mobileEnabled = !0, e.mobileAutoEnable = !1, document.removeEventListener("touchend", r, !0)
                    }
                };
                return document.addEventListener("touchend", r, !0), e
            }
        },
        _autoSuspend: function() {
            var e = this;
            if (e.autoSuspend && e.ctx && "undefined" != typeof e.ctx.suspend && n.usingWebAudio) {
                for (var o = 0; o < e._howls.length; o++)
                    if (e._howls[o]._webAudio)
                        for (var t = 0; t < e._howls[o]._sounds.length; t++)
                            if (!e._howls[o]._sounds[t]._paused) return e;
                return e._suspendTimer && clearTimeout(e._suspendTimer), e._suspendTimer = setTimeout(function() {
                    e.autoSuspend && (e._suspendTimer = null, e.state = "suspending", e.ctx.suspend().then(function() {
                        e.state = "suspended", e._resumeAfterSuspend && (delete e._resumeAfterSuspend, e._autoResume())
                    }))
                }, 3e4), e
            }
        },
        _autoResume: function() {
            var e = this;
            if (e.ctx && "undefined" != typeof e.ctx.resume && n.usingWebAudio) return "running" === e.state && e._suspendTimer ? (clearTimeout(e._suspendTimer), e._suspendTimer = null) : "suspended" === e.state ? (e.state = "resuming", e.ctx.resume().then(function() {
                e.state = "running"
            }), e._suspendTimer && (clearTimeout(e._suspendTimer), e._suspendTimer = null)) : "suspending" === e.state && (e._resumeAfterSuspend = !0), e
        }
    };
    var n = new e,
        o = function(e) {
            var n = this;
            return e.src && 0 !== e.src.length ? void n.init(e) : void console.error("An array of source files must be passed with any new Howl.")
        };
    o.prototype = {
        init: function(e) {
            var o = this;
            return n.ctx || _(), o._autoplay = e.autoplay || !1, o._format = "string" != typeof e.format ? e.format : [e.format], o._html5 = e.html5 || !1, o._muted = e.mute || !1, o._loop = e.loop || !1, o._pool = e.pool || 5, o._preload = "boolean" != typeof e.preload || e.preload, o._rate = e.rate || 1, o._sprite = e.sprite || {}, o._src = "string" != typeof e.src ? e.src : [e.src], o._volume = void 0 !== e.volume ? e.volume : 1, o._duration = 0, o._state = "unloaded", o._sounds = [], o._endTimers = {}, o._queue = [], o._onend = e.onend ? [{
                fn: e.onend
            }] : [], o._onfade = e.onfade ? [{
                fn: e.onfade
            }] : [], o._onload = e.onload ? [{
                fn: e.onload
            }] : [], o._onloaderror = e.onloaderror ? [{
                fn: e.onloaderror
            }] : [], o._onpause = e.onpause ? [{
                fn: e.onpause
            }] : [], o._onplay = e.onplay ? [{
                fn: e.onplay
            }] : [], o._onstop = e.onstop ? [{
                fn: e.onstop
            }] : [], o._onmute = e.onmute ? [{
                fn: e.onmute
            }] : [], o._onvolume = e.onvolume ? [{
                fn: e.onvolume
            }] : [], o._onrate = e.onrate ? [{
                fn: e.onrate
            }] : [], o._onseek = e.onseek ? [{
                fn: e.onseek
            }] : [], o._webAudio = n.usingWebAudio && !o._html5, "undefined" != typeof n.ctx && n.ctx && n.mobileAutoEnable && n._enableMobileAudio(), n._howls.push(o), o._preload && o.load(), o
        },
        load: function() {
            var e = this,
                o = null;
            if (n.noAudio) return void e._emit("loaderror", null, "No audio support.");
            "string" == typeof e._src && (e._src = [e._src]);
            for (var r = 0; r < e._src.length; r++) {
                var a, d;
                if (e._format && e._format[r]) a = e._format[r];
                else {
                    if (d = e._src[r], "string" != typeof d) {
                        e._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                        continue
                    }
                    a = /^data:audio\/([^;,]+);/i.exec(d), a || (a = /\.([^.]+)$/.exec(d.split("?", 1)[0])), a && (a = a[1].toLowerCase())
                }
                if (n.codecs(a)) {
                    o = e._src[r];
                    break
                }
            }
            return o ? (e._src = o, e._state = "loading", "https:" === window.location.protocol && "http:" === o.slice(0, 5) && (e._html5 = !0, e._webAudio = !1), new t(e), e._webAudio && u(e), e) : void e._emit("loaderror", null, "No codec support for selected audio sources.")
        },
        play: function(e, o) {
            var t = this,
                r = null;
            if ("number" == typeof e) r = e, e = null;
            else {
                if ("string" == typeof e && "loaded" === t._state && !t._sprite[e]) return null;
                if ("undefined" == typeof e) {
                    e = "__default";
                    for (var u = 0, a = 0; a < t._sounds.length; a++) t._sounds[a]._paused && !t._sounds[a]._ended && (u++, r = t._sounds[a]._id);
                    1 === u ? e = null : r = null
                }
            }
            var d = r ? t._soundById(r) : t._inactiveSound();
            if (!d) return null;
            if (r && !e && (e = d._sprite || "__default"), "loaded" !== t._state && !t._sprite[e]) return t._queue.push({
                event: "play",
                action: function() {
                    t.play(t._soundById(d._id) ? d._id : void 0)
                }
            }), d._id;
            if (r && !d._paused) return o || setTimeout(function() {
                t._emit("play", d._id)
            }, 0), d._id;
            t._webAudio && n._autoResume();
            var i = d._seek > 0 ? d._seek : t._sprite[e][0] / 1e3,
                _ = (t._sprite[e][0] + t._sprite[e][1]) / 1e3 - i,
                s = 1e3 * _ / Math.abs(d._rate);
            d._paused = !1, d._ended = !1, d._sprite = e, d._seek = i, d._start = t._sprite[e][0] / 1e3, d._stop = (t._sprite[e][0] + t._sprite[e][1]) / 1e3, d._loop = !(!d._loop && !t._sprite[e][2]);
            var l = d._node;
            if (t._webAudio) {
                var f = function() {
                    t._refreshBuffer(d);
                    var e = d._muted || t._muted ? 0 : d._volume;
                    l.gain.setValueAtTime(e, n.ctx.currentTime), d._playStart = n.ctx.currentTime, "undefined" == typeof l.bufferSource.start ? d._loop ? l.bufferSource.noteGrainOn(0, i, 86400) : l.bufferSource.noteGrainOn(0, i, _) : d._loop ? l.bufferSource.start(0, i, 86400) : l.bufferSource.start(0, i, _), s !== 1 / 0 && (t._endTimers[d._id] = setTimeout(t._ended.bind(t, d), s)), o || setTimeout(function() {
                        t._emit("play", d._id)
                    }, 0)
                };
                "loaded" === t._state ? f() : (t.once("load", f, d._id), t._clearTimer(d._id))
            } else {
                var c = function() {
                        l.currentTime = i, l.muted = d._muted || t._muted || n._muted || l.muted, l.volume = d._volume * n.volume(), l.playbackRate = d._rate, setTimeout(function() {
                            l.play(), s !== 1 / 0 && (t._endTimers[d._id] = setTimeout(t._ended.bind(t, d), s)), o || t._emit("play", d._id)
                        }, 0)
                    },
                    p = "loaded" === t._state && (window && window.ejecta || !l.readyState && n._navigator.isCocoonJS);
                if (4 === l.readyState || p) c();
                else {
                    var m = function() {
                        c(), l.removeEventListener(n._canPlayEvent, m, !1)
                    };
                    l.addEventListener(n._canPlayEvent, m, !1), t._clearTimer(d._id)
                }
            }
            return d._id
        },
        pause: function(e) {
            var n = this;
            if ("loaded" !== n._state) return n._queue.push({
                event: "pause",
                action: function() {
                    n.pause(e)
                }
            }), n;
            for (var o = n._getSoundIds(e), t = 0; t < o.length; t++) {
                n._clearTimer(o[t]);
                var r = n._soundById(o[t]);
                if (r && !r._paused) {
                    if (r._seek = n.seek(o[t]), r._rateSeek = 0, r._paused = !0, n._stopFade(o[t]), r._node)
                        if (n._webAudio) {
                            if (!r._node.bufferSource) return n;
                            "undefined" == typeof r._node.bufferSource.stop ? r._node.bufferSource.noteOff(0) : r._node.bufferSource.stop(0), n._cleanBuffer(r._node)
                        } else isNaN(r._node.duration) && r._node.duration !== 1 / 0 || r._node.pause();
                    arguments[1] || n._emit("pause", r._id)
                }
            }
            return n
        },
        stop: function(e, n) {
            var o = this;
            if ("loaded" !== o._state) return o._queue.push({
                event: "stop",
                action: function() {
                    o.stop(e)
                }
            }), o;
            for (var t = o._getSoundIds(e), r = 0; r < t.length; r++) {
                o._clearTimer(t[r]);
                var u = o._soundById(t[r]);
                if (u && !u._paused && (u._seek = u._start || 0, u._rateSeek = 0, u._paused = !0, u._ended = !0, o._stopFade(t[r]), u._node))
                    if (o._webAudio) {
                        if (!u._node.bufferSource) return o;
                        "undefined" == typeof u._node.bufferSource.stop ? u._node.bufferSource.noteOff(0) : u._node.bufferSource.stop(0), o._cleanBuffer(u._node)
                    } else isNaN(u._node.duration) && u._node.duration !== 1 / 0 || (u._node.currentTime = u._start || 0, u._node.pause());
                u && !n && o._emit("stop", u._id)
            }
            return o
        },
        mute: function(e, o) {
            var t = this;
            if ("loaded" !== t._state) return t._queue.push({
                event: "mute",
                action: function() {
                    t.mute(e, o)
                }
            }), t;
            if ("undefined" == typeof o) {
                if ("boolean" != typeof e) return t._muted;
                t._muted = e
            }
            for (var r = t._getSoundIds(o), u = 0; u < r.length; u++) {
                var a = t._soundById(r[u]);
                a && (a._muted = e, t._webAudio && a._node ? a._node.gain.setValueAtTime(e ? 0 : a._volume, n.ctx.currentTime) : a._node && (a._node.muted = !!n._muted || e), t._emit("mute", a._id))
            }
            return t
        },
        volume: function() {
            var e, o, t = this,
                r = arguments;
            if (0 === r.length) return t._volume;
            if (1 === r.length) {
                var u = t._getSoundIds(),
                    a = u.indexOf(r[0]);
                a >= 0 ? o = parseInt(r[0], 10) : e = parseFloat(r[0])
            } else r.length >= 2 && (e = parseFloat(r[0]), o = parseInt(r[1], 10));
            var d;
            if (!("undefined" != typeof e && e >= 0 && e <= 1)) return d = o ? t._soundById(o) : t._sounds[0], d ? d._volume : 0;
            if ("loaded" !== t._state) return t._queue.push({
                event: "volume",
                action: function() {
                    t.volume.apply(t, r)
                }
            }), t;
            "undefined" == typeof o && (t._volume = e), o = t._getSoundIds(o);
            for (var i = 0; i < o.length; i++) d = t._soundById(o[i]), d && (d._volume = e, r[2] || t._stopFade(o[i]), t._webAudio && d._node && !d._muted ? d._node.gain.setValueAtTime(e, n.ctx.currentTime) : d._node && !d._muted && (d._node.volume = e * n.volume()), t._emit("volume", d._id));
            return t
        },
        fade: function(e, o, t, r) {
            var u = this,
                a = Math.abs(e - o),
                d = e > o ? "out" : "in",
                i = a / .01,
                _ = t / i;
            if ("loaded" !== u._state) return u._queue.push({
                event: "fade",
                action: function() {
                    u.fade(e, o, t, r)
                }
            }), u;
            u.volume(e, r);
            for (var s = u._getSoundIds(r), l = 0; l < s.length; l++) {
                var f = u._soundById(s[l]);
                if (f) {
                    if (r || u._stopFade(s[l]), u._webAudio && !f._muted) {
                        var c = n.ctx.currentTime,
                            p = c + t / 1e3;
                        f._volume = e, f._node.gain.setValueAtTime(e, c), f._node.gain.linearRampToValueAtTime(o, p)
                    }
                    var m = e;
                    f._interval = setInterval(function(e, n) {
                        m += "in" === d ? .01 : -.01, m = Math.max(0, m), m = Math.min(1, m), m = Math.round(100 * m) / 100, u._webAudio ? ("undefined" == typeof r && (u._volume = m), n._volume = m) : u.volume(m, e, !0), m === o && (clearInterval(n._interval), n._interval = null, u.volume(m, e), u._emit("fade", e))
                    }.bind(u, s[l], f), _)
                }
            }
            return u
        },
        _stopFade: function(e) {
            var o = this,
                t = o._soundById(e);
            return t && t._interval && (o._webAudio && t._node.gain.cancelScheduledValues(n.ctx.currentTime), clearInterval(t._interval), t._interval = null, o._emit("fade", e)), o
        },
        loop: function() {
            var e, n, o, t = this,
                r = arguments;
            if (0 === r.length) return t._loop;
            if (1 === r.length) {
                if ("boolean" != typeof r[0]) return o = t._soundById(parseInt(r[0], 10)), !!o && o._loop;
                e = r[0], t._loop = e
            } else 2 === r.length && (e = r[0], n = parseInt(r[1], 10));
            for (var u = t._getSoundIds(n), a = 0; a < u.length; a++) o = t._soundById(u[a]), o && (o._loop = e, t._webAudio && o._node && o._node.bufferSource && (o._node.bufferSource.loop = e));
            return t
        },
        rate: function() {
            var e, o, t = this,
                r = arguments;
            if (0 === r.length) o = t._sounds[0]._id;
            else if (1 === r.length) {
                var u = t._getSoundIds(),
                    a = u.indexOf(r[0]);
                a >= 0 ? o = parseInt(r[0], 10) : e = parseFloat(r[0])
            } else 2 === r.length && (e = parseFloat(r[0]), o = parseInt(r[1], 10));
            var d;
            if ("number" != typeof e) return d = t._soundById(o), d ? d._rate : t._rate;
            if ("loaded" !== t._state) return t._queue.push({
                event: "rate",
                action: function() {
                    t.rate.apply(t, r)
                }
            }), t;
            "undefined" == typeof o && (t._rate = e), o = t._getSoundIds(o);
            for (var i = 0; i < o.length; i++)
                if (d = t._soundById(o[i])) {
                    d._rateSeek = t.seek(o[i]), d._playStart = t._webAudio ? n.ctx.currentTime : d._playStart, d._rate = e, t._webAudio && d._node && d._node.bufferSource ? d._node.bufferSource.playbackRate.value = e : d._node && (d._node.playbackRate = e);
                    var _ = t.seek(o[i]),
                        s = (t._sprite[d._sprite][0] + t._sprite[d._sprite][1]) / 1e3 - _,
                        l = 1e3 * s / Math.abs(d._rate);
                    !t._endTimers[o[i]] && d._paused || (t._clearTimer(o[i]), t._endTimers[o[i]] = setTimeout(t._ended.bind(t, d), l)), t._emit("rate", d._id)
                }
            return t
        },
        seek: function() {
            var e, o, t = this,
                r = arguments;
            if (0 === r.length) o = t._sounds[0]._id;
            else if (1 === r.length) {
                var u = t._getSoundIds(),
                    a = u.indexOf(r[0]);
                a >= 0 ? o = parseInt(r[0], 10) : (o = t._sounds[0]._id, e = parseFloat(r[0]))
            } else 2 === r.length && (e = parseFloat(r[0]), o = parseInt(r[1], 10));
            if ("undefined" == typeof o) return t;
            if ("loaded" !== t._state) return t._queue.push({
                event: "seek",
                action: function() {
                    t.seek.apply(t, r)
                }
            }), t;
            var d = t._soundById(o);
            if (d) {
                if (!("number" == typeof e && e >= 0)) {
                    if (t._webAudio) {
                        var i = t.playing(o) ? n.ctx.currentTime - d._playStart : 0,
                            _ = d._rateSeek ? d._rateSeek - d._seek : 0;
                        return d._seek + (_ + i * Math.abs(d._rate))
                    }
                    return d._node.currentTime
                }
                var s = t.playing(o);
                s && t.pause(o, !0), d._seek = e, d._ended = !1, t._clearTimer(o), s && t.play(o, !0), !t._webAudio && d._node && (d._node.currentTime = e), t._emit("seek", o)
            }
            return t
        },
        playing: function(e) {
            var n = this;
            if ("number" == typeof e) {
                var o = n._soundById(e);
                return !!o && !o._paused
            }
            for (var t = 0; t < n._sounds.length; t++)
                if (!n._sounds[t]._paused) return !0;
            return !1
        },
        duration: function(e) {
            var n = this,
                o = n._duration,
                t = n._soundById(e);
            return t && (o = n._sprite[t._sprite][1] / 1e3), o
        },
        state: function() {
            return this._state
        },
        unload: function() {
            for (var e = this, o = e._sounds, t = 0; t < o.length; t++) {
                o[t]._paused || (e.stop(o[t]._id), e._emit("end", o[t]._id)), e._webAudio || (o[t]._node.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", o[t]._node.removeEventListener("error", o[t]._errorFn, !1), o[t]._node.removeEventListener(n._canPlayEvent, o[t]._loadFn, !1)), delete o[t]._node, e._clearTimer(o[t]._id);
                var u = n._howls.indexOf(e);
                u >= 0 && n._howls.splice(u, 1)
            }
            var a = !0;
            for (t = 0; t < n._howls.length; t++)
                if (n._howls[t]._src === e._src) {
                    a = !1;
                    break
                }
            return r && a && delete r[e._src], e._state = "unloaded", e._sounds = [], e = null, null
        },
        on: function(e, n, o, t) {
            var r = this,
                u = r["_on" + e];
            return "function" == typeof n && u.push(t ? {
                id: o,
                fn: n,
                once: t
            } : {
                id: o,
                fn: n
            }), r
        },
        off: function(e, n, o) {
            var t = this,
                r = t["_on" + e],
                u = 0;
            if (n) {
                for (u = 0; u < r.length; u++)
                    if (n === r[u].fn && o === r[u].id) {
                        r.splice(u, 1);
                        break
                    }
            } else if (e) t["_on" + e] = [];
            else {
                var a = Object.keys(t);
                for (u = 0; u < a.length; u++) 0 === a[u].indexOf("_on") && Array.isArray(t[a[u]]) && (t[a[u]] = [])
            }
            return t
        },
        once: function(e, n, o) {
            var t = this;
            return t.on(e, n, o, 1), t
        },
        _emit: function(e, n, o) {
            for (var t = this, r = t["_on" + e], u = r.length - 1; u >= 0; u--) r[u].id && r[u].id !== n && "load" !== e || (setTimeout(function(e) {
                e.call(this, n, o)
            }.bind(t, r[u].fn), 0), r[u].once && t.off(e, r[u].fn, r[u].id));
            return t
        },
        _loadQueue: function() {
            var e = this;
            if (e._queue.length > 0) {
                var n = e._queue[0];
                e.once(n.event, function() {
                    e._queue.shift(), e._loadQueue()
                }), n.action()
            }
            return e
        },
        _ended: function(e) {
            var o = this,
                t = e._sprite,
                r = !(!e._loop && !o._sprite[t][2]);
            if (o._emit("end", e._id), !o._webAudio && r && o.stop(e._id, !0).play(e._id), o._webAudio && r) {
                o._emit("play", e._id), e._seek = e._start || 0, e._rateSeek = 0, e._playStart = n.ctx.currentTime;
                var u = 1e3 * (e._stop - e._start) / Math.abs(e._rate);
                o._endTimers[e._id] = setTimeout(o._ended.bind(o, e), u)
            }
            return o._webAudio && !r && (e._paused = !0, e._ended = !0, e._seek = e._start || 0, e._rateSeek = 0, o._clearTimer(e._id), o._cleanBuffer(e._node), n._autoSuspend()), o._webAudio || r || o.stop(e._id), o
        },
        _clearTimer: function(e) {
            var n = this;
            return n._endTimers[e] && (clearTimeout(n._endTimers[e]), delete n._endTimers[e]), n
        },
        _soundById: function(e) {
            for (var n = this, o = 0; o < n._sounds.length; o++)
                if (e === n._sounds[o]._id) return n._sounds[o];
            return null
        },
        _inactiveSound: function() {
            var e = this;
            e._drain();
            for (var n = 0; n < e._sounds.length; n++)
                if (e._sounds[n]._ended) return e._sounds[n].reset();
            return new t(e)
        },
        _drain: function() {
            var e = this,
                n = e._pool,
                o = 0,
                t = 0;
            if (!(e._sounds.length < n)) {
                for (t = 0; t < e._sounds.length; t++) e._sounds[t]._ended && o++;
                for (t = e._sounds.length - 1; t >= 0; t--) {
                    if (o <= n) return;
                    e._sounds[t]._ended && (e._webAudio && e._sounds[t]._node && e._sounds[t]._node.disconnect(0), e._sounds.splice(t, 1), o--)
                }
            }
        },
        _getSoundIds: function(e) {
            var n = this;
            if ("undefined" == typeof e) {
                for (var o = [], t = 0; t < n._sounds.length; t++) o.push(n._sounds[t]._id);
                return o
            }
            return [e]
        },
        _refreshBuffer: function(e) {
            var o = this;
            return e._node.bufferSource = n.ctx.createBufferSource(), e._node.bufferSource.buffer = r[o._src], e._panner ? e._node.bufferSource.connect(e._panner) : e._node.bufferSource.connect(e._node), e._node.bufferSource.loop = e._loop, e._loop && (e._node.bufferSource.loopStart = e._start || 0, e._node.bufferSource.loopEnd = e._stop), e._node.bufferSource.playbackRate.value = e._rate, o
        },
        _cleanBuffer: function(e) {
            var n = this;
            if (n._scratchBuffer) {
                e.bufferSource.onended = null, e.bufferSource.disconnect(0);
                try {
                    e.bufferSource.buffer = n._scratchBuffer
                } catch (e) {}
            }
            return e.bufferSource = null, n
        }
    };
    var t = function(e) {
        this._parent = e, this.init()
    };
    t.prototype = {
        init: function() {
            var e = this,
                n = e._parent;
            return e._muted = n._muted, e._loop = n._loop, e._volume = n._volume, e._muted = n._muted, e._rate = n._rate, e._seek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = Math.round(Date.now() * Math.random()), n._sounds.push(e), e.create(), e
        },
        create: function() {
            var e = this,
                o = e._parent,
                t = n._muted || e._muted || e._parent._muted ? 0 : e._volume;
            return o._webAudio ? (e._node = "undefined" == typeof n.ctx.createGain ? n.ctx.createGainNode() : n.ctx.createGain(), e._node.gain.setValueAtTime(t, n.ctx.currentTime), e._node.paused = !0, e._node.connect(n.masterGain)) : (e._node = new Audio, e._errorFn = e._errorListener.bind(e), e._node.addEventListener("error", e._errorFn, !1), e._loadFn = e._loadListener.bind(e), e._node.addEventListener(n._canPlayEvent, e._loadFn, !1), e._node.src = o._src, e._node.preload = "auto", e._node.volume = t * n.volume(), e._node.load()), e
        },
        reset: function() {
            var e = this,
                n = e._parent;
            return e._muted = n._muted, e._loop = n._loop, e._volume = n._volume, e._muted = n._muted, e._rate = n._rate, e._seek = 0, e._rateSeek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = Math.round(Date.now() * Math.random()), e
        },
        _errorListener: function() {
            var e = this;
            e._node.error && 4 === e._node.error.code && (n.noAudio = !0), e._parent._emit("loaderror", e._id, e._node.error ? e._node.error.code : 0), e._node.removeEventListener("error", e._errorListener, !1)
        },
        _loadListener: function() {
            var e = this,
                o = e._parent;
            o._duration = Math.ceil(10 * e._node.duration) / 10, 0 === Object.keys(o._sprite).length && (o._sprite = {
                __default: [0, 1e3 * o._duration]
            }), "loaded" !== o._state && (o._state = "loaded", o._emit("load"), o._loadQueue()), o._autoplay && o.play(), e._node.removeEventListener(n._canPlayEvent, e._loadFn, !1)
        }
    };
    var r = {},
        u = function(e) {
            var n = e._src;
            if (r[n]) return e._duration = r[n].duration, void i(e);
            if (/^data:[^;]+;base64,/.test(n)) {
                for (var o = atob(n.split(",")[1]), t = new Uint8Array(o.length), u = 0; u < o.length; ++u) t[u] = o.charCodeAt(u);
                d(t.buffer, e)
            } else {
                var _ = new XMLHttpRequest;
                _.open("GET", n, !0), _.responseType = "arraybuffer", _.onload = function() {
                    var n = (_.status + "")[0];
                    return "0" !== n && "2" !== n && "3" !== n ? void e._emit("loaderror", null, "Failed loading audio file with status: " + _.status + ".") : void d(_.response, e)
                }, _.onerror = function() {
                    e._webAudio && (e._html5 = !0, e._webAudio = !1, e._sounds = [], delete r[n], e.load())
                }, a(_)
            }
        },
        a = function(e) {
            try {
                e.send()
            } catch (n) {
                e.onerror()
            }
        },
        d = function(e, o) {
            n.ctx.decodeAudioData(e, function(e) {
                e && o._sounds.length > 0 && (r[o._src] = e, i(o, e))
            }, function() {
                o._emit("loaderror", null, "Decoding audio data failed.")
            })
        },
        i = function(e, n) {
            n && !e._duration && (e._duration = n.duration), 0 === Object.keys(e._sprite).length && (e._sprite = {
                __default: [0, 1e3 * e._duration]
            }), "loaded" !== e._state && (e._state = "loaded", e._emit("load"), e._loadQueue()), e._autoplay && e.play()
        },
        _ = function() {
            n.noAudio = !1;
            try {
                "undefined" != typeof AudioContext ? n.ctx = new AudioContext : "undefined" != typeof webkitAudioContext ? n.ctx = new webkitAudioContext : n.usingWebAudio = !1
            } catch (e) {
                n.usingWebAudio = !1
            }
            if (!n.usingWebAudio)
                if ("undefined" != typeof Audio) try {
                    var e = new Audio;
                    "undefined" == typeof e.oncanplaythrough && (n._canPlayEvent = "canplay")
                } catch (e) {
                    n.noAudio = !0
                } else n.noAudio = !0;
            try {
                var e = new Audio;
                e.muted && (n.noAudio = !0)
            } catch (e) {}
            var o = /iP(hone|od|ad)/.test(n._navigator && n._navigator.platform),
                t = n._navigator && n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),
                r = t ? parseInt(t[1], 10) : null;
            if (o && r && r < 9) {
                var u = /safari/.test(n._navigator && n._navigator.userAgent.toLowerCase());
                (n._navigator && n._navigator.standalone && !u || n._navigator && !n._navigator.standalone && !u) && (n.usingWebAudio = !1)
            }
            n.usingWebAudio && (n.masterGain = "undefined" == typeof n.ctx.createGain ? n.ctx.createGainNode() : n.ctx.createGain(), n.masterGain.gain.value = 1, n.masterGain.connect(n.ctx.destination)), n._setup()
        };
    "function" == typeof define && define.amd && define([], function() {
        return {
            Howler: n,
            Howl: o
        }
    }), "undefined" != typeof exports && (exports.Howler = n, exports.Howl = o), "undefined" != typeof window ? (window.HowlerGlobal = e, window.Howler = n, window.Howl = o, window.Sound = t) : "undefined" != typeof global && (global.HowlerGlobal = e, global.Howler = n, global.Howl = o, global.Sound = t)
}();
! function() {
    "use strict";
    HowlerGlobal.prototype._pos = [0, 0, 0], HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0], HowlerGlobal.prototype.stereo = function(e) {
        var n = this;
        if (!n.ctx || !n.ctx.listener) return n;
        for (var t = n._howls.length - 1; t >= 0; t--) n._howls[t].stereo(e);
        return n
    }, HowlerGlobal.prototype.pos = function(e, n, t) {
        var o = this;
        return o.ctx && o.ctx.listener ? (n = "number" != typeof n ? o._pos[1] : n, t = "number" != typeof t ? o._pos[2] : t, "number" != typeof e ? o._pos : (o._pos = [e, n, t], o.ctx.listener.setPosition(o._pos[0], o._pos[1], o._pos[2]), o)) : o
    }, HowlerGlobal.prototype.orientation = function(e, n, t, o, r, i) {
        var a = this;
        if (!a.ctx || !a.ctx.listener) return a;
        var p = a._orientation;
        return n = "number" != typeof n ? p[1] : n, t = "number" != typeof t ? p[2] : t, o = "number" != typeof o ? p[3] : o, r = "number" != typeof r ? p[4] : r, i = "number" != typeof i ? p[5] : i, "number" != typeof e ? p : (a._orientation = [e, n, t, o, r, i], a.ctx.listener.setOrientation(e, n, t, o, r, i), a)
    }, Howl.prototype.init = function(e) {
        return function(n) {
            var t = this;
            return t._orientation = n.orientation || [1, 0, 0], t._stereo = n.stereo || null, t._pos = n.pos || null, t._pannerAttr = {
                coneInnerAngle: "undefined" != typeof n.coneInnerAngle ? n.coneInnerAngle : 360,
                coneOuterAngle: "undefined" != typeof n.coneOuterAngle ? n.coneOuterAngle : 360,
                coneOuterGain: "undefined" != typeof n.coneOuterGain ? n.coneOuterGain : 0,
                distanceModel: "undefined" != typeof n.distanceModel ? n.distanceModel : "inverse",
                maxDistance: "undefined" != typeof n.maxDistance ? n.maxDistance : 1e4,
                panningModel: "undefined" != typeof n.panningModel ? n.panningModel : "HRTF",
                refDistance: "undefined" != typeof n.refDistance ? n.refDistance : 1,
                rolloffFactor: "undefined" != typeof n.rolloffFactor ? n.rolloffFactor : 1
            }, t._onstereo = n.onstereo ? [{
                fn: n.onstereo
            }] : [], t._onpos = n.onpos ? [{
                fn: n.onpos
            }] : [], t._onorientation = n.onorientation ? [{
                fn: n.onorientation
            }] : [], e.call(this, n)
        }
    }(Howl.prototype.init), Howl.prototype.stereo = function(n, t) {
        var o = this;
        if (!o._webAudio) return o;
        if ("loaded" !== o._state) return o._queue.push({
            event: "stereo",
            action: function() {
                o.stereo(n, t)
            }
        }), o;
        var r = "undefined" == typeof Howler.ctx.createStereoPanner ? "spatial" : "stereo";
        if ("undefined" == typeof t) {
            if ("number" != typeof n) return o._stereo;
            o._stereo = n, o._pos = [n, 0, 0]
        }
        for (var i = o._getSoundIds(t), a = 0; a < i.length; a++) {
            var p = o._soundById(i[a]);
            if (p) {
                if ("number" != typeof n) return p._stereo;
                p._stereo = n, p._pos = [n, 0, 0], p._node && (p._pannerAttr.panningModel = "equalpower", p._panner && p._panner.pan || e(p, r), "spatial" === r ? p._panner.setPosition(n, 0, 0) : p._panner.pan.value = n), o._emit("stereo", p._id)
            }
        }
        return o
    }, Howl.prototype.pos = function(n, t, o, r) {
        var i = this;
        if (!i._webAudio) return i;
        if ("loaded" !== i._state) return i._queue.push({
            event: "pos",
            action: function() {
                i.pos(n, t, o, r)
            }
        }), i;
        if (t = "number" != typeof t ? 0 : t, o = "number" != typeof o ? -.5 : o, "undefined" == typeof r) {
            if ("number" != typeof n) return i._pos;
            i._pos = [n, t, o]
        }
        for (var a = i._getSoundIds(r), p = 0; p < a.length; p++) {
            var f = i._soundById(a[p]);
            if (f) {
                if ("number" != typeof n) return f._pos;
                f._pos = [n, t, o], f._node && (f._panner && !f._panner.pan || e(f, "spatial"), f._panner.setPosition(n, t, o)), i._emit("pos", f._id)
            }
        }
        return i
    }, Howl.prototype.orientation = function(n, t, o, r) {
        var i = this;
        if (!i._webAudio) return i;
        if ("loaded" !== i._state) return i._queue.push({
            event: "orientation",
            action: function() {
                i.orientation(n, t, o, r)
            }
        }), i;
        if (t = "number" != typeof t ? i._orientation[1] : t, o = "number" != typeof o ? i._orientation[2] : o, "undefined" == typeof r) {
            if ("number" != typeof n) return i._orientation;
            i._orientation = [n, t, o]
        }
        for (var a = i._getSoundIds(r), p = 0; p < a.length; p++) {
            var f = i._soundById(a[p]);
            if (f) {
                if ("number" != typeof n) return f._orientation;
                f._orientation = [n, t, o], f._node && (f._panner || (f._pos || (f._pos = i._pos || [0, 0, -.5]), e(f, "spatial")), f._panner.setOrientation(n, t, o)), i._emit("orientation", f._id)
            }
        }
        return i
    }, Howl.prototype.pannerAttr = function() {
        var n, t, o, r = this,
            i = arguments;
        if (!r._webAudio) return r;
        if (0 === i.length) return r._pannerAttr;
        if (1 === i.length) {
            if ("object" != typeof i[0]) return o = r._soundById(parseInt(i[0], 10)), o ? o._pannerAttr : r._pannerAttr;
            n = i[0], "undefined" == typeof t && (r._pannerAttr = {
                coneInnerAngle: "undefined" != typeof n.coneInnerAngle ? n.coneInnerAngle : r._coneInnerAngle,
                coneOuterAngle: "undefined" != typeof n.coneOuterAngle ? n.coneOuterAngle : r._coneOuterAngle,
                coneOuterGain: "undefined" != typeof n.coneOuterGain ? n.coneOuterGain : r._coneOuterGain,
                distanceModel: "undefined" != typeof n.distanceModel ? n.distanceModel : r._distanceModel,
                maxDistance: "undefined" != typeof n.maxDistance ? n.maxDistance : r._maxDistance,
                panningModel: "undefined" != typeof n.panningModel ? n.panningModel : r._panningModel,
                refDistance: "undefined" != typeof n.refDistance ? n.refDistance : r._refDistance,
                rolloffFactor: "undefined" != typeof n.rolloffFactor ? n.rolloffFactor : r._rolloffFactor
            })
        } else 2 === i.length && (n = i[0], t = parseInt(i[1], 10));
        for (var a = r._getSoundIds(t), p = 0; p < a.length; p++)
            if (o = r._soundById(a[p])) {
                var f = o._pannerAttr;
                f = {
                    coneInnerAngle: "undefined" != typeof n.coneInnerAngle ? n.coneInnerAngle : f.coneInnerAngle,
                    coneOuterAngle: "undefined" != typeof n.coneOuterAngle ? n.coneOuterAngle : f.coneOuterAngle,
                    coneOuterGain: "undefined" != typeof n.coneOuterGain ? n.coneOuterGain : f.coneOuterGain,
                    distanceModel: "undefined" != typeof n.distanceModel ? n.distanceModel : f.distanceModel,
                    maxDistance: "undefined" != typeof n.maxDistance ? n.maxDistance : f.maxDistance,
                    panningModel: "undefined" != typeof n.panningModel ? n.panningModel : f.panningModel,
                    refDistance: "undefined" != typeof n.refDistance ? n.refDistance : f.refDistance,
                    rolloffFactor: "undefined" != typeof n.rolloffFactor ? n.rolloffFactor : f.rolloffFactor
                };
                var s = o._panner;
                s ? (s.coneInnerAngle = f.coneInnerAngle, s.coneOuterAngle = f.coneOuterAngle, s.coneOuterGain = f.coneOuterGain, s.distanceModel = f.distanceModel, s.maxDistance = f.maxDistance, s.panningModel = f.panningModel, s.refDistance = f.refDistance, s.rolloffFactor = f.rolloffFactor) : (o._pos || (o._pos = r._pos || [0, 0, -.5]), e(o, "spatial"))
            }
        return r
    }, Sound.prototype.init = function(e) {
        return function() {
            var n = this,
                t = n._parent;
            n._orientation = t._orientation, n._stereo = t._stereo, n._pos = t._pos, n._pannerAttr = t._pannerAttr, e.call(this), n._stereo ? t.stereo(n._stereo) : n._pos && t.pos(n._pos[0], n._pos[1], n._pos[2], n._id)
        }
    }(Sound.prototype.init), Sound.prototype.reset = function(e) {
        return function() {
            var n = this,
                t = n._parent;
            return n._orientation = t._orientation, n._pos = t._pos, n._pannerAttr = t._pannerAttr, e.call(this)
        }
    }(Sound.prototype.reset);
    var e = function(e, n) {
        n = n || "spatial", "spatial" === n ? (e._panner = Howler.ctx.createPanner(), e._panner.coneInnerAngle = e._pannerAttr.coneInnerAngle, e._panner.coneOuterAngle = e._pannerAttr.coneOuterAngle, e._panner.coneOuterGain = e._pannerAttr.coneOuterGain, e._panner.distanceModel = e._pannerAttr.distanceModel, e._panner.maxDistance = e._pannerAttr.maxDistance, e._panner.panningModel = e._pannerAttr.panningModel, e._panner.refDistance = e._pannerAttr.refDistance, e._panner.rolloffFactor = e._pannerAttr.rolloffFactor, e._panner.setPosition(e._pos[0], e._pos[1], e._pos[2]), e._panner.setOrientation(e._orientation[0], e._orientation[1], e._orientation[2])) : (e._panner = Howler.ctx.createStereoPanner(), e._panner.pan.value = e._stereo), e._panner.connect(e._node), e._paused || e._parent.pause(e._id, !0).play(e._id)
    }
}();
gdjs.HowlerSound = function(o) {
    Howl.call(this, o);
    this._paused = false;
    this._stopped = true;
    this._canBeDestroyed = false;
    this._rate = o.rate || 1;
    var that = this;
    this.on("end", function() {
        if (!that.loop()) {
            that._canBeDestroyed = true;
            that._paused = false;
            that._stopped = true
        }
    });
    this.on("play", function() {
        that._paused = false;
        that._stopped = false
    });
    this.on("pause", function() {
        that._paused = true;
        that._stopped = false
    })
};
gdjs.HowlerSound.prototype = Object.create(Howl.prototype);
gdjs.HowlerSound.prototype.paused = function() {
    return this._paused
};
gdjs.HowlerSound.prototype.stopped = function() {
    return this._stopped
};
gdjs.HowlerSound.prototype.stop = function() {
    this._paused = false;
    this._stopped = true;
    return Howl.prototype.stop.call(this)
};
gdjs.HowlerSound.prototype.canBeDestroyed = function() {
    return this._canBeDestroyed
};
gdjs.HowlerSound.prototype.rate = function() {
    return this._rate
};
gdjs.HowlerSoundManager = function(resources) {
    this._resources = resources;
    this._availableResources = {};
    this._sounds = {};
    this._musics = {};
    this._freeSounds = [];
    this._freeMusics = []
};
gdjs.SoundManager = gdjs.HowlerSoundManager;
gdjs.HowlerSoundManager.clampRate = function(rate) {
    if (rate > 4) return 4;
    if (rate < .5) return .5;
    return rate
};
gdjs.HowlerSoundManager.prototype._getFileFromSoundName = function(soundName) {
    if (this._availableResources.hasOwnProperty(soundName) && this._availableResources[soundName].file) {
        return this._availableResources[soundName].file
    }
    return soundName
};
gdjs.HowlerSoundManager.prototype._storeSoundInArray = function(arr, sound) {
    var index = null;
    for (var i = 0, len = arr.length; i < len; ++i) {
        if (arr[i] !== null && arr[i].canBeDestroyed()) {
            arr[index] = sound;
            return sound
        }
    }
    arr.push(sound);
    return sound
};
gdjs.HowlerSoundManager.prototype.playSound = function(soundName, loop, volume, pitch) {
    var soundFile = this._getFileFromSoundName(soundName);
    var sound = new gdjs.HowlerSound({
        src: [soundFile],
        loop: loop,
        volume: volume / 100,
        rate: gdjs.HowlerSoundManager.clampRate(pitch)
    });
    this._storeSoundInArray(this._freeSounds, sound).play()
};
gdjs.HowlerSoundManager.prototype.playSoundOnChannel = function(soundName, channel, loop, volume, pitch) {
    var oldSound = this._sounds[channel];
    if (oldSound) {
        oldSound.stop()
    }
    var soundFile = this._getFileFromSoundName(soundName);
    var sound = new gdjs.HowlerSound({
        src: [soundFile],
        loop: loop,
        volume: volume / 100,
        rate: gdjs.HowlerSoundManager.clampRate(pitch)
    });
    sound.play();
    this._sounds[channel] = sound
};
gdjs.HowlerSoundManager.prototype.getSoundOnChannel = function(channel) {
    return this._sounds[channel]
};
gdjs.HowlerSoundManager.prototype.playMusic = function(soundName, loop, volume, pitch) {
    var soundFile = this._getFileFromSoundName(soundName);
    var sound = new gdjs.HowlerSound({
        src: [soundFile],
        loop: loop,
        html5: true,
        volume: volume / 100,
        rate: gdjs.HowlerSoundManager.clampRate(pitch)
    });
    this._storeSoundInArray(this._freeMusics, sound).play()
};
gdjs.HowlerSoundManager.prototype.playMusicOnChannel = function(soundName, channel, loop, volume, pitch) {
    var oldMusic = this._musics[channel];
    if (oldMusic) {
        oldMusic.stop()
    }
    var soundFile = this._getFileFromSoundName(soundName);
    var music = new gdjs.HowlerSound({
        src: [soundFile],
        loop: loop,
        html5: true,
        volume: volume / 100,
        rate: gdjs.HowlerSoundManager.clampRate(pitch)
    });
    music.play();
    this._musics[channel] = music
};
gdjs.HowlerSoundManager.prototype.getMusicOnChannel = function(channel) {
    return this._musics[channel]
};
gdjs.HowlerSoundManager.prototype.setGlobalVolume = function(volume) {
    Howler.volume(volume / 100)
};
gdjs.HowlerSoundManager.prototype.getGlobalVolume = function() {
    return Howler.volume() * 100
};
gdjs.HowlerSoundManager.prototype.clearAll = function() {
    for (var i = 0; i < this._freeSounds.length; ++i) {
        if (this._freeSounds[i]) this._freeSounds[i].stop()
    }
    for (var i = 0; i < this._freeMusics.length; ++i) {
        if (this._freeMusics[i]) this._freeMusics[i].stop()
    }
    this._freeSounds.length = 0;
    this._freeMusics.length = 0;
    for (var p in this._sounds) {
        if (this._sounds.hasOwnProperty(p) && this._sounds[p]) {
            this._sounds[p].stop();
            delete this._sounds[p]
        }
    }
    for (var p in this._musics) {
        if (this._musics.hasOwnProperty(p) && this._musics[p]) {
            this._musics[p].stop();
            delete this._musics[p]
        }
    }
};
gdjs.HowlerSoundManager.prototype.preloadAudio = function(onProgress, onComplete, resources) {
    resources = resources || this._resources;
    var files = [];
    for (var i = 0, len = resources.length; i < len; ++i) {
        var res = resources[i];
        if (res.file && res.kind === "audio") {
            this._availableResources[res.name] = res;
            if (files.indexOf(res.file) === -1) {
                files.push(res.file)
            }
        }
    }
    if (files.length === 0) return onComplete();
    var loaded = 0;

    function onLoad(audioFile) {
        console.log("loaded" + audioFile);
        loaded++;
        if (loaded === files.length) {
            console.log("All audio loaded");
            return onComplete()
        }
        onProgress(loaded, files.length)
    }
    var that = this;
    for (var i = 0; i < files.length; ++i) {
        (function(audioFile) {
            console.log("Loading" + audioFile);
            var sound = new Howl({
                src: [audioFile],
                preload: true,
                onload: onLoad.bind(that, audioFile),
                onloaderror: onLoad.bind(that, audioFile)
            })
        })(files[i])
    }
};
gdjs.projectData = {
    firstLayout: "",
    gdVersion: {
        build: 94,
        major: 4,
        minor: 0,
        revision: 0
    },
    properties: {
        folderProject: false,
        linuxExecutableFilename: "",
        macExecutableFilename: "",
        packageName: "com.example.gamename",
        useExternalSourceFiles: false,
        winExecutableFilename: "",
        winExecutableIconFile: "",
        name: "Proyecto",
        author: "",
        windowWidth: 400,
        windowHeight: 600,
        latestCompilationDirectory: "D:\\gdevelop examples\\export\\web\\ingles",
        maxFPS: 60,
        minFPS: 10,
        verticalSync: false,
        extensions: [{
            name: "BuiltinObject"
        }, {
            name: "BuiltinAudio"
        }, {
            name: "BuiltinVariables"
        }, {
            name: "BuiltinTime"
        }, {
            name: "BuiltinMouse"
        }, {
            name: "BuiltinKeyboard"
        }, {
            name: "BuiltinJoystick"
        }, {
            name: "BuiltinCamera"
        }, {
            name: "BuiltinWindow"
        }, {
            name: "BuiltinFile"
        }, {
            name: "BuiltinNetwork"
        }, {
            name: "BuiltinScene"
        }, {
            name: "BuiltinAdvanced"
        }, {
            name: "Sprite"
        }, {
            name: "BuiltinCommonInstructions"
        }, {
            name: "BuiltinCommonConversions"
        }, {
            name: "BuiltinStringInstructions"
        }, {
            name: "BuiltinMathematicalTools"
        }, {
            name: "BuiltinExternalLayouts"
        }, {
            name: "TextObject"
        }, {
            name: "DraggableBehavior"
        }],
        platforms: [{
            name: "GDevelop JS platform"
        }],
        currentPlatform: "GDevelop JS platform"
    },
    resources: {
        resources: [{
            alwaysLoaded: false,
            file: "logo.png",
            kind: "image",
            name: "logo.png",
            smoothed: true,
            userAdded: false
        }, {
            alwaysLoaded: false,
            file: "54.jpg",
            kind: "image",
            name: "54.jpg",
            smoothed: true,
            userAdded: false
        }],
        resourceFolders: []
    },
    objects: [],
    objectsGroups: [],
    variables: [],
    layouts: [{
        b: 255,
        disableInputWhenNotFocused: true,
        mangledName: "dos",
        name: "dos",
        oglFOV: 90,
        oglZFar: 500,
        oglZNear: 1,
        r: 255,
        standardSortMethod: false,
        stopSoundsOnStartup: true,
        title: "",
        v: 255,
        uiSettings: {
            grid: false,
            gridB: 255,
            gridG: 180,
            gridHeight: 32,
            gridOffsetX: 0,
            gridOffsetY: 0,
            gridR: 158,
            gridWidth: 32,
            snap: true,
            windowMask: false,
            zoomFactor: 1
        },
        objectsGroups: [],
        variables: [],
        instances: [{
            angle: 0,
            customSize: true,
            height: 70,
            layer: "",
            locked: false,
            name: "logo",
            width: 206,
            x: 150,
            y: 77,
            zOrder: 1,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: true,
            height: 147,
            layer: "",
            locked: false,
            name: "imagen",
            width: 93,
            x: 75,
            y: 153,
            zOrder: 2,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: true,
            height: 95,
            layer: "",
            locked: false,
            name: "text",
            width: 140,
            x: 233,
            y: 233,
            zOrder: 3,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: false,
            height: 0,
            layer: "",
            locked: false,
            name: "boys",
            width: 0,
            x: 108,
            y: 468,
            zOrder: 4,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: false,
            height: 0,
            layer: "",
            locked: false,
            name: "NuevoObjeto2",
            width: 0,
            x: 99,
            y: 381,
            zOrder: 5,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: false,
            height: 0,
            layer: "",
            locked: false,
            name: "NuevoObjeto3",
            width: 0,
            x: 229,
            y: 385,
            zOrder: 6,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: false,
            height: 0,
            layer: "",
            locked: false,
            name: "NuevoObjeto4",
            width: 0,
            x: 229,
            y: 458,
            zOrder: 7,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }],
        objects: [{
            name: "logo",
            type: "Sprite",
            variables: [],
            behaviors: [],
            animations: [{
                name: "",
                useMultipleDirections: false,
                directions: [{
                    looping: false,
                    timeBetweenFrames: 1,
                    sprites: [{
                        hasCustomCollisionMask: false,
                        image: "logo.png",
                        points: [],
                        originPoint: {
                            name: "origine",
                            x: 0,
                            y: 0
                        },
                        centerPoint: {
                            automatic: true,
                            name: "centre",
                            x: 91,
                            y: 29.5
                        },
                        customCollisionMask: [
                            [{
                                x: 0,
                                y: 0
                            }, {
                                x: 182,
                                y: 0
                            }, {
                                x: 182,
                                y: 59
                            }, {
                                x: 0,
                                y: 59
                            }]
                        ]
                    }]
                }]
            }]
        }, {
            bold: false,
            italic: false,
            name: "text",
            smoothed: true,
            type: "TextObject::Text",
            underlined: false,
            variables: [],
            behaviors: [],
            string: "En hora  buena",
            font: "",
            characterSize: 20,
            color: {
                b: 0,
                g: 255,
                r: 0
            }
        }, {
            name: "imagen",
            type: "Sprite",
            variables: [],
            behaviors: [],
            animations: [{
                name: "",
                useMultipleDirections: false,
                directions: [{
                    looping: false,
                    timeBetweenFrames: 1,
                    sprites: [{
                        hasCustomCollisionMask: false,
                        image: "54.jpg",
                        points: [],
                        originPoint: {
                            name: "origine",
                            x: 0,
                            y: 0
                        },
                        centerPoint: {
                            automatic: true,
                            name: "centre",
                            x: 32,
                            y: 59
                        },
                        customCollisionMask: [
                            [{
                                x: 0,
                                y: 0
                            }, {
                                x: 64,
                                y: 0
                            }, {
                                x: 64,
                                y: 118
                            }, {
                                x: 0,
                                y: 118
                            }]
                        ]
                    }]
                }]
            }]
        }, {
            bold: false,
            italic: false,
            name: "boys",
            smoothed: true,
            type: "TextObject::Text",
            underlined: false,
            variables: [{
                name: "paso",
                value: "0"
            }],
            behaviors: [],
            string: "Boy",
            font: "",
            characterSize: 20,
            color: {
                b: 0,
                g: 0,
                r: 0
            }
        }, {
            bold: false,
            italic: false,
            name: "NuevoObjeto2",
            smoothed: true,
            type: "TextObject::Text",
            underlined: false,
            variables: [],
            behaviors: [],
            string: "Girl",
            font: "",
            characterSize: 20,
            color: {
                b: 0,
                g: 0,
                r: 0
            }
        }, {
            bold: false,
            italic: false,
            name: "NuevoObjeto3",
            smoothed: true,
            type: "TextObject::Text",
            underlined: false,
            variables: [],
            behaviors: [],
            string: "Father\n",
            font: "",
            characterSize: 20,
            color: {
                b: 0,
                g: 0,
                r: 0
            }
        }, {
            bold: false,
            italic: false,
            name: "NuevoObjeto4",
            smoothed: true,
            type: "TextObject::Text",
            underlined: false,
            variables: [],
            behaviors: [],
            string: "Mother\n",
            font: "",
            characterSize: 20,
            color: {
                b: 0,
                g: 0,
                r: 0
            }
        }],
        events: [],
        layers: [{
            name: "",
            visibility: true,
            cameras: [{
                defaultSize: true,
                defaultViewport: true,
                height: 0,
                viewportBottom: 1,
                viewportLeft: 0,
                viewportRight: 1,
                viewportTop: 0,
                width: 0
            }],
            effects: []
        }],
        behaviorsSharedData: []
    }, {
        b: 255,
        disableInputWhenNotFocused: true,
        mangledName: "gana",
        name: "gana",
        oglFOV: 90,
        oglZFar: 500,
        oglZNear: 1,
        r: 255,
        standardSortMethod: false,
        stopSoundsOnStartup: true,
        title: "",
        v: 255,
        uiSettings: {
            grid: false,
            gridB: 255,
            gridG: 180,
            gridHeight: 32,
            gridOffsetX: 0,
            gridOffsetY: 0,
            gridR: 158,
            gridWidth: 32,
            snap: true,
            windowMask: false,
            zoomFactor: 1
        },
        objectsGroups: [],
        variables: [],
        instances: [{
            angle: 0,
            customSize: true,
            height: 174,
            layer: "",
            locked: false,
            name: "doslogo",
            width: 249,
            x: 92,
            y: 120,
            zOrder: 1,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }, {
            angle: 0,
            customSize: false,
            height: 0,
            layer: "",
            locked: false,
            name: "NuevoObjeto",
            width: 0,
            x: 138,
            y: 407,
            zOrder: 2,
            numberProperties: [],
            stringProperties: [],
            initialVariables: []
        }],
        objects: [{
            name: "doslogo",
            type: "Sprite",
            variables: [],
            behaviors: [],
            animations: [{
                name: "",
                useMultipleDirections: false,
                directions: [{
                    looping: false,
                    timeBetweenFrames: 1,
                    sprites: [{
                        hasCustomCollisionMask: false,
                        image: "logo.png",
                        points: [],
                        originPoint: {
                            name: "origine",
                            x: 0,
                            y: 0
                        },
                        centerPoint: {
                            automatic: true,
                            name: "centre",
                            x: 91,
                            y: 29.5
                        },
                        customCollisionMask: [
                            [{
                                x: 0,
                                y: 0
                            }, {
                                x: 182,
                                y: 0
                            }, {
                                x: 182,
                                y: 59
                            }, {
                                x: 0,
                                y: 59
                            }]
                        ]
                    }]
                }]
            }]
        }, {
            bold: false,
            italic: false,
            name: "NuevoObjeto",
            smoothed: true,
            type: "TextObject::Text",
            underlined: false,
            variables: [],
            behaviors: [],
            string: "OK",
            font: "",
            characterSize: 20,
            color: {
                b: 56,
                g: 223,
                r: 0
            }
        }],
        events: [],
        layers: [{
            name: "",
            visibility: true,
            cameras: [{
                defaultSize: true,
                defaultViewport: true,
                height: 0,
                viewportBottom: 1,
                viewportLeft: 0,
                viewportRight: 1,
                viewportTop: 0,
                width: 0
            }],
            effects: []
        }],
        behaviorsSharedData: []
    }],
    externalEvents: [],
    externalLayouts: [],
    externalSourceFiles: []
};