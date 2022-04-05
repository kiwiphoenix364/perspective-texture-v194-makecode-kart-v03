
namespace renderer {
    let projXX: Fx14
    let projYY: Fx14
    let projYZ: Fx14
    let cameraHeight: Fx14
    let cameraX: Fx14
    let cameraY: Fx14
    let cosHeading: Fx14
    let sinHeading: Fx14
    let tanFov: Fx14
    let zClipFar: Fx14 = F14.zeroFx14
    let zNearFx14 = Fx14(zNear)

    let spriteCount: number = 0
    let spriteX: number[] = []
    let spriteY: number[] = []
    let spriteZ: number[] = []
    let spriteWidth: number[] = []
    let spriteHeight: number[] = []
    let spriteImage: Image[] = []
    let spriteIndex: number[] = []

    let backgroundImage: Image = null
    let backgroundColor: number = 0

    let debugging = false

    export function setDebugging(val: boolean) {
        debugging = val
    }

    export function setZClipFar(farZ: number) {
        zClipFar = Fx14(farZ)
    }
    
    function addImage(x: number, y: number, z: number, w: number, h: number, img: Image) {
        spriteX[spriteCount] = x
        spriteY[spriteCount] = y
        spriteZ[spriteCount] = z
        spriteWidth[spriteCount] = w
        spriteHeight[spriteCount] = h
        spriteImage[spriteCount] = img
        spriteIndex[spriteCount] = spriteCount
        ++spriteCount
    }

    function isSetRowsBroken(buf: Buffer, img: Image): boolean {
        buf[80 * 120 + 60] = 1
        img.setRows(0, buf)
        return img.getPixel(80, 60) != 1
    }

    export function setUp(drawSprites: () => void) {
        let screenBuffer = Buffer.create(160 * 120)
        let screenBufferTested = false
        let z_z: Fx14[] = []
        let yFrac: Fx14[] = []
        let n_z = Fx14(1 / zNear)
        let f_z = Fx14(1 / zFar)
        for (let y2 = horizonY; y2 <= 119; y2++) {
            let yf = (y2 - horizonY) / 79
            yFrac[y2] = Fx14(yf)
            z_z[y2] = Fx14(1 / ((1 / zFar) + ((1 / zNear) - (1 / zFar)) * yf))
        }
        tanFov = Fx14(Math.tan(fov / 2 * Math.PI / 180))
        let secFov = 1 / Math.cos(fov / 2 * Math.PI / 180)

        if (F14.equals(zClipFar, F14.zeroFx14)) zClipFar = Fx14(zFar)

        const zLayer = -1
        scene.createRenderable(zLayer, (image: Image, camera: scene.Camera) => {
            // Do we need a workaround for unusable setRows on simulator?
            // See https://github.com/microsoft/pxt-arcade/issues/4690
            if (!screenBufferTested) {
                if (isSetRowsBroken(screenBuffer, image)) {
                    screenBuffer = null
                }
                screenBufferTested = true
            }

            let leftDx = Fx14(Math.sin((heading - fov / 2) * Math.PI / 180) * secFov)
            let leftDy = Fx14(-Math.cos((heading - fov / 2) * Math.PI / 180) * secFov)
            let rightDx = Fx14(Math.sin((heading + fov / 2) * Math.PI / 180) * secFov)
            let rightDy = Fx14(-Math.cos((heading + fov / 2) * Math.PI / 180) * secFov)
            cosHeading = Fx14(Math.cos(heading * Math.PI / 180))
            sinHeading = Fx14(Math.sin(heading * Math.PI / 180))

            // Camera position is slightly behind the player position.
            cameraX = F14.sub(Fx14(px), F14.mulLS(Fx14(followDistance), sinHeading))
            cameraY = F14.add(Fx14(py), F14.mulLS(Fx14(followDistance), cosHeading))

            let cx = cameraX
            let cy = cameraY

            // Calculate texture UV for the left/right and near/far corners.
            // They need to be divided by Z so that they can be interpolated.
            // +---------------+
            // |               |
            // |===============|
            // | lf         rf |
            // |               |
            // | ln         rn |
            // +---------------+
            let u_ln_z = F14.add(F14.mulLL(cx, n_z), leftDx)
            let v_ln_z = F14.add(F14.mulLL(cy, n_z), leftDy)
            let u_rn_z = F14.add(F14.mulLL(cx, n_z), rightDx)
            let v_rn_z = F14.add(F14.mulLL(cy, n_z), rightDy)
            let u_lf_z = F14.add(F14.mulLL(cx, f_z), leftDx)
            let v_lf_z = F14.add(F14.mulLL(cy, f_z), leftDy)
            let u_rf_z = F14.add(F14.mulLL(cx, f_z), rightDx)
            let v_rf_z = F14.add(F14.mulLL(cy, f_z), rightDy)

            for (let y = horizonY; y <= 119; ++y) {
                let yf = yFrac[y]
                let zmul = z_z[y]
                let u_l_z = F14.add(u_lf_z, F14.mulLS(F14.sub(u_ln_z, u_lf_z), yf))
                let v_l_z = F14.add(v_lf_z, F14.mulLS(F14.sub(v_ln_z, v_lf_z), yf))
                let u_r_z = F14.add(u_rf_z, F14.mulLS(F14.sub(u_rn_z, u_rf_z), yf))
                let v_r_z = F14.add(v_rf_z, F14.mulLS(F14.sub(v_rn_z, v_rf_z), yf))
                let u = F14.add(F14.mulLL(u_l_z, zmul), F14.oneHalfFx14)
                let v = F14.add(F14.mulLL(v_l_z, zmul), F14.oneHalfFx14)
                let du = F14.idiv(F14.mulLL(F14.sub(u_r_z, u_l_z), zmul), 160)
                let dv = F14.idiv(F14.mulLL(F14.sub(v_r_z, v_l_z), zmul), 160)

                if (screenBuffer) {
                    let bufIdx = y
                    for (let x = 0; x < 160; x++) {
                        let intU = F14.toIntFloor(u)
                        let intV = F14.toIntFloor(v)
                        let col = trackImage.getPixel(intU, intV) || outsideTrackColor
                        screenBuffer[bufIdx] = col
                        u = F14.add(u, du)
                        v = F14.add(v, dv)
                        bufIdx += 120
                    }
                } else {
                    for (let x = 0; x < 160; x++) {
                        let intU = F14.toIntFloor(u)
                        let intV = F14.toIntFloor(v)
                        let col = trackImage.getPixel(intU, intV) || outsideTrackColor
                        image.setPixel(x, y, col)
                        u = F14.add(u, du)
                        v = F14.add(v, dv)
                    }
                }
            }
            if (screenBuffer) image.setRows(0, screenBuffer)

            if (backgroundImage) {
                drawBackgroundImage(image)
            } else if (backgroundColor) {
                image.fillRect(0, 0, 159, horizonY, backgroundColor)
            }

            if (debugging) drawDebugCubes(image)
            spriteCount = 0
            drawSprites()
            let indexSorted = spriteIndex.slice(0, spriteCount)
            indexSorted.sort((a, b) => spriteZ[a] - spriteZ[b])
            for (let j = 0; j < spriteCount; ++j) {
                let k = indexSorted[j]
                let img = spriteImage[k]
                screen.blit(spriteX[k], spriteY[k], spriteWidth[k], spriteHeight[k],
                    img, 0, 0, img.width, img.height, true, false)
            }

        })

        // Calculate the true horizon Y position for an infinite plane.
        // It's a bit higher than the horizonY variable which corresponds
        // to the zFar distance.
        // 
        //      _-|
        //    _-  |t
        //   .......... trueHorizonY
        //   |\.  |
        //   | \ .|____ horizonY
        // -b|  \ |.
        //   |   \|  .
        //   +----\    .
        //   |  n  \     .
        //   |      \      .
        //   |       \       .
        //   |        \        .
        //   +_________\         .
        //      zNear            
        //   |<-          zFar ->|
        //
        // zNear: y = 119
        // zFar: y = horizonY
        // 
        let trueHorizonY = 119 - (119 - horizonY) * zFar / (zFar - zNear)
        //console.log("trueHorizonY=" + trueHorizonY)

        // Calculate projection matrix. Right and left are symmetrical, top and bottom are different.
        let r = Math.tan(fov / 2 * Math.PI / 180)
        let t_b_height = 2 * r * 120 / 160
        let t = t_b_height * trueHorizonY / 120
        let b = t_b_height * (trueHorizonY / 120 - 1)
        //console.log("view frustum r=" + r + " t=" + t + " b=" + b)
        projXX = Fx14(1 / r)
        projYY = Fx14(2 / t_b_height)
        projYZ = Fx14((t + b) / (t - b))
        cameraHeight = Fx14(-b * zNear)
        //console.log("cameraHeight=" + F14.toFloat(cameraHeight))
    }

    export function setBackgroundImage(image: Image) {
        backgroundImage = image
    }

    export function setBackgroundSolidColor(color: number) {
        backgroundColor = color
    }

    function drawBackgroundImage(image: Image) {
        let srcW = backgroundImage.width
        let destW = srcW * 90 / fov
        let bgPos = Math.floor((360 - heading) * destW * 2 / 360)
        //carSprite.say("h=" + heading + ", " + bgPos + ", " + (bgPos - srcW * 2))
        image.blit(bgPos - destW * 2, 0, destW, horizonY,
            backgroundImage, 0, 0, srcW, horizonY, false, false)
        image.blit(bgPos - destW, 0, destW, horizonY,
            backgroundImage, 0, horizonY, srcW, horizonY, false, false)
        image.blit(bgPos, 0, destW, horizonY,
            backgroundImage, 0, 0, srcW, horizonY, false, false)
    }

    export function getCameraHeight(): number {
        return F14.toFloat(cameraHeight)
    }

    function drawDebugCubes(image: Image) {
        drawCube(image, 10, 73, 0.5)
        drawCube(image, 10, 73, getCameraHeight())
        drawCube(image, 11, 72, 0.5)
        drawCube(image, 20, 72, 0.5)

        drawCube(image, 8, 76, 0.5)

        // Draw a cross marking the player car position
        let a = localToScreen(-0.5, -getCameraHeight(), -followDistance - 0.5)
        let b = localToScreen(0.5, -getCameraHeight(), -followDistance - 0.5)
        let c = localToScreen(0.5, -getCameraHeight(), -followDistance + 0.5)
        let d = localToScreen(-0.5, -getCameraHeight(), -followDistance + 0.5)
        //console.log("xSize=" + (b[0] - a[0]) + " ySize=" + (c[1] - a[1]))
        image.drawLine(a[0], a[1], c[0], c[1], 5)
        image.drawLine(b[0], b[1], d[0], d[1], 5)
    }

    function drawCube(image: Image, x: number, y: number, z: number) {
        let f = worldToScreen(x - 0.5, y - 0.5, z - 0.5)
        let g = worldToScreen(x + 0.5, y - 0.5, z - 0.5)
        let h = worldToScreen(x + 0.5, y + 0.5, z - 0.5)
        let l = worldToScreen(x - 0.5, y + 0.5, z - 0.5)
        let m = worldToScreen(x - 0.5, y - 0.5, z + 0.5)
        let n = worldToScreen(x + 0.5, y - 0.5, z + 0.5)
        let o = worldToScreen(x + 0.5, y + 0.5, z + 0.5)
        let p = worldToScreen(x - 0.5, y + 0.5, z + 0.5)
        if (f[2] < 0 && g[2] < 0 && h[2] < 0 && l[2] < 0 &&
            m[2] < 0 && n[2] < 0 && o[2] < 0 && p[2] < 0) {
            image.drawLine(f[0], f[1], g[0], g[1], 15)
            image.drawLine(g[0], g[1], h[0], h[1], 15)
            image.drawLine(h[0], h[1], l[0], l[1], 15)
            image.drawLine(l[0], l[1], f[0], f[1], 15)
            image.drawLine(m[0], m[1], n[0], n[1], 15)
            image.drawLine(n[0], n[1], o[0], o[1], 15)
            image.drawLine(o[0], o[1], p[0], p[1], 15)
            image.drawLine(p[0], p[1], m[0], m[1], 15)
            image.drawLine(f[0], f[1], m[0], m[1], 15)
            image.drawLine(g[0], g[1], n[0], n[1], 15)
            image.drawLine(h[0], h[1], o[0], o[1], 15)
            image.drawLine(l[0], l[1], p[0], p[1], 15)
        }
    }

    export function localToScreenArray(out: Fx14[], x: Fx14, y: Fx14, z: Fx14) {
        if (F14.less(z, F14.zeroFx14)) {
            let xscale = F14.divMM(F14.neg(projXX), z)
            let yscale = F14.divMM(F14.neg(projYY), z)
            let ndc_x = F14.mulLL(x, xscale)
            let ndc_y = F14.sub(F14.mulLL(y, yscale), projYZ)
            out[0] = F14.imul(F14.add(ndc_x, F14.oneFx14), 80)
            out[1] = F14.imul(F14.sub(F14.oneFx14, ndc_y), 60)
            out[4] = xscale
            out[5] = yscale
        }
        out[2] = z
        //console.log("(u=" + F14.toFloat(x) + " v=" + F14.toFloat(y) + " h=" + F14.toFloat(z) + ") (" + F14.toFloat(out[0]) + ", " + F14.toFloat(out[1]) + ", " + F14.toFloat(out[2]) + ")")
    }
    export function localToScreen(x: number, y: number, z: number): number[] {
        let out: Fx14[] = []
        localToScreenArray(out, Fx14(x), Fx14(y), Fx14(z))
        return out.map(F14.toFloat)
    }

    export function worldToLocalArray(out: Fx14[], u: Fx14, v: Fx14, h: Fx14) {
        out[1] = F14.sub(h, cameraHeight)
        let tx = F14.sub(u, cameraX)
        let tz = F14.sub(v, cameraY)
        out[0] = F14.add(F14.mulLS(tx, cosHeading), F14.mulLS(tz, sinHeading))
        out[2] = F14.sub(F14.mulLS(tz, cosHeading), F14.mulLS(tx, sinHeading))
        //console.log("(u=" + F14.toFloat(u) + " v=" + F14.toFloat(v) + " h=" + F14.toFloat(h) + ") (" + F14.toFloat(out[0]) + ", " + F14.toFloat(out[1]) + ", " + F14.toFloat(out[2]) + ")")
    }
    export function worldToLocal(u: Fx14, v: Fx14, h: Fx14): Fx14[] {
        let out2: Fx14[] = []
        worldToLocalArray(out2, u, v, h)
        return out2
    }

    let tmpWorldToScreenArray: Fx14[] = []
    export function worldToScreenArray(out: Fx14[], u: Fx14, v: Fx14, h: Fx14) {
        let pos: Fx14[] = tmpWorldToScreenArray
        worldToLocalArray(pos, u, v, h)
        localToScreenArray(out, pos[0], pos[1], pos[2])
    }
    export function worldToScreen(u: number, v: number, h: number): number[] {
        let out3: Fx14[] = []
        worldToScreenArray(out3, Fx14(u), Fx14(v), Fx14(h))
        return out3.map(F14.toFloat)
    }

    //% blockId=place_3d_image
    //% block="place image %image=screen_image_picker at x=%x y=%y height=%h, size %baseSize || anchor %anchor"
    //% baseSize.defl=1
    //% anchor.defl=ScaleAnchor.Bottom
    //% inlineInputMode=inline
    export function place3dImage(image: Image, x: number, y: number, h: number, baseSize: number, anchor?: ScaleAnchor) {
        place3dImageFx14(image, Fx14(x), Fx14(y), Fx14(h), Fx14(baseSize), anchor)
    }

    //% blockId=placed_3d_image_is_visible
    //% block="placed image %image=screen_image_picker at x=%x y=%y height=%h, size %baseSize is visible || anchor %anchor"
    //% baseSize.defl=1
    //% anchor.defl=ScaleAnchor.Bottom
    //% inlineInputMode=inline
    export function placed3dImageIsVisible(image: Image, x: number, y: number, h: number, baseSize: number, anchor?: ScaleAnchor): boolean {
        return place3dImageFx14(image, Fx14(x), Fx14(y), Fx14(h), Fx14(baseSize), anchor)
    }

    let tmpPlace3dImage: Fx14[] = []
    export function place3dImageFx14(image: Image, x: Fx14, y: Fx14, h: Fx14, baseSize: Fx14, anchor?: ScaleAnchor): boolean {
        let pos2: Fx14[] = tmpPlace3dImage
        worldToLocalArray(pos2, x, y, h)
        let localX = pos2[0]
        let localY = pos2[1]
        let localZ = pos2[2]
        if (F14.greaterOrEqual(F14.leftShift(localZ, 1), F14.neg(zNearFx14)) || 
            F14.greater(F14.neg(localZ), zClipFar) ||
            F14.less(F14.mulLS(F14.add(localX, baseSize), tanFov), localZ) ||
            F14.less(F14.mulLS(F14.neg(F14.sub(localX, baseSize)), tanFov), localZ)) {
            //console.log("OFFSCREEN local=(" + localX + ", " + localY + ", " + localZ + ")")
            // Sprite is offscreen
            return false
        }
        //console.log("visible local=(" + localX + ", " + localY + ", " + localZ + ")")
        localToScreenArray(pos2, localX, localY, localZ)
        let screenX = pos2[0]
        let screenY = pos2[1]
        let screenZ = pos2[2]
        //console.log("x=" + pos2[0] + " y=" + pos2[1] + " z=" + pos2[2] + " scale=" + pos2[4])
        //let spriteScale = sprites.readDataNumber(sprite, "3dScale")
        //if (!spriteScale) {
        //    spriteScale = baseSize * 80 / sprite.image.width
        //    sprites.setDataNumber(sprite, "3dScale", spriteScale)
        //}
        let imageScale = F14.idiv(F14.imul(baseSize, 80), image.width)
        let scale = F14.mulLL(pos2[4], imageScale)
        if (!anchor) anchor = ScaleAnchor.Bottom
        let attachX = (anchor & ScaleAnchor.Left) ?
            0 :
            (anchor & ScaleAnchor.Right) ? image.width : (image.width >> 1)
        let attachY = (anchor & ScaleAnchor.Top) ?
            0 :
            (anchor & ScaleAnchor.Bottom) ? image.height : (image.height >> 1)
        addImage(F14.toInt(F14.sub(screenX, F14.imul(scale, attachX))),
                 F14.toInt(F14.sub(screenY, F14.imul(scale, attachY))),
                 F14.toInt14(screenZ, 8), 
                 F14.toInt(F14.imul(scale, image.width)), 
                 F14.toInt(F14.imul(scale, image.height)), 
                 image)
        return true
    }

    let tmpPlayerSpritePos: Fx14[] = []
    export function placePlayerSprite(sprite: Sprite, attachX: number, attachY: number) {
        let pos3: Fx14[] = tmpPlayerSpritePos
        localToScreenArray(pos3, F14.zeroFx14, F14.neg(cameraHeight), Fx14(-followDistance))
        carSprite.setPosition(F14.toInt(pos3[0]) + (sprite.width >> 1) - attachX, F14.toInt(pos3[1]) + (sprite.height >> 1) - attachY)
        //carSprite.say("x=" + carSprite.x + " y=" + carSprite.y)
    }
}
