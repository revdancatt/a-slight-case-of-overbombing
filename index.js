/* global fxrand cloud1 water1 Image fetch createImageBitmap */
const ratio = 1.41
const features = {}
const startTime = new Date().getTime()
const makeFeatures = () => {
  //  These are the combinations of the land we can get, along with the % chance of getting it picked
  const lands = {
    SSCC: 25,
    SLLC: 25,
    SSLC: 25,
    SLCC: 25
  }
  /*
  const lands = {
    'SSCC': 100
  }
  */

  const palette = ['dark', 'medium', 'light']
  features.speed = {
    fast: 300,
    medium: 700,
    slow: 1500
  }

  const palettes = {
    England: {
      dark: '#F30000',
      medium: '#F37878',
      light: '#F3B6B6'
    },
    Wales: {
      dark: '#D95C24',
      medium: '#E8A730',
      light: '#F1D726'
    },
    Scotland: {
      dark: '#425EFF',
      medium: '#A1AFFF',
      light: '#D9DEFF'
    },
    Ireland: {
      dark: '#00D13A',
      medium: '#69D185',
      light: '#9DD1AB'
    }
  }

  const runSimulation = false
  let dropSize = 1
  let simTimes = 1
  const tally = {}
  let tallyTotal = 0
  for (const land in lands) {
    tally[land] = 0
  }
  let thisLand = null

  //  For fun we are going to simulate running the drop a few times to we can see how the actual
  //  land numbers fall out
  if (runSimulation) {
    dropSize = 256
    simTimes = 100
  }

  //  Run the simulation
  for (let l = 0; l < dropSize * simTimes; l++) {
    const landChance = Math.floor(fxrand() * 100)
    thisLand = null
    let total = 0
    for (const land in lands) {
      if (landChance >= total) thisLand = land
      total += lands[land]
    }
    tally[thisLand] += 1 / simTimes
    tallyTotal += 1 / simTimes
  }
  const finalTally = []
  for (const t in tally) {
    finalTally.push({
      land: t,
      appears: parseFloat(tally[t].toFixed(2)),
      percent: parseFloat((tally[t] / tallyTotal * 100).toFixed(2))
    })
  }
  if (runSimulation) {
    console.log(`On a drop size of ${dropSize} this is how many times each land will statistically appear.
S = Sky
L = Land
C = Sea`)
    console.table(finalTally)
  }

  //  Now we figure out which country we are in
  const countryChance = fxrand()
  let country = 'England'
  if (countryChance < 0.75) country = 'Wales'
  if (countryChance < 0.5) country = 'Scotland'
  if (countryChance < 0.25) country = 'Ireland'
  // country = 'Scotland'

  features.land = thisLand
  features.country = country
  features.palette = palette
  features.palettes = palettes
  features.strips = [
    [],
    [],
    [],
    []
  ]

  /* #########################################################################
   *
   * SKY
   *
   * ###################################################################### */
  let thisColour = 'dark'
  let oldColour1 = 'dark'
  let oldColour2 = null
  for (const i in features.land) {
    //  If this thing is a sky, then we do sky things
    if (features.land[i] === 'S') {
      //  Sometimes we will have 1 curve, other times 3, but most of the time we'll have 2
      let target = 2
      if (fxrand() < 0.5) {
        target = 3
        if (fxrand() < 0.1) target = 1
      }

      //  Reset for next strip
      thisColour = 'dark'
      oldColour1 = 'dark'
      oldColour2 = null

      //  I want to keep track of which starting (middle) and end points have been used
      //  so we don't use each one twice. There are a few ways of doing this, but I'm
      //  going to go for the fairly long-winded way of tracking them
      const started = []
      const ended = []

      //  Now we know how many curves there will be we need to make them
      for (let t = 0; t < target; t++) {
        const curve = {}
        //  Add the default features
        curve.mode = 'full'
        curve.flipped = true
        curve.textured = false
        curve.texture = 1

        //  The starting and ending postion can be in any of five points
        //  Top, Bottom, Middle and the two quarter points
        curve.start = Math.floor(fxrand() * 5) * 0.25
        curve.end = curve.start
        //  The end can't match the start
        while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
        //  Now do it all over again, until we know we've used points that
        //  haven't already been used
        while (started.includes(curve.start) || ended.includes(curve.end)) {
          curve.start = Math.floor(fxrand() * 5) * 0.25
          curve.end = curve.start
          while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
        }
        //  Record the start and end point so we don't use them again
        started.push(curve.start)
        ended.push(curve.end)

        //  Work out the colours
        while (thisColour === oldColour1 || thisColour === oldColour2) {
          thisColour = features.palette[Math.floor(fxrand() * features.palette.length)]
        }
        oldColour2 = oldColour1
        oldColour1 = thisColour
        curve.colour = thisColour

        //  Store the curve
        features.strips[i].push(curve)
      }
      //  Sort them into "largest" to "smallest", so we draw back to front
      features.strips[i] = features.strips[i].sort((a, b) => ((a.start + a.end) < (b.start + b.end)) ? 1 : (((b.start + b.end) < (a.start + a.end)) ? -1 : 0))
    }
  }

  //  If we have two skys, then the first one needs to be marked as not flipped,
  //  and we need to check to see if they have matching middle colours
  // let middleHappened = false
  if (features.land[0] === 'S' && features.land[1] === 'S') {
    for (const cloud of features.strips[0]) {
      cloud.flipped = false
    }

    //  Check to see the final cloud of the top strip is the same colour as the
    //  final cloud of the bottom strip, if so texture them.
    if (features.strips[0][features.strips[0].length - 1].colour === features.strips[1][features.strips[1].length - 1].colour) {
      features.strips[0][features.strips[0].length - 1].textured = true
      features.strips[1][features.strips[1].length - 1].textured = true
      // middleHappened = true
    }
  }

  for (const strip in features.land) {
    if (features.land[strip] === 'S') {
      let first = null
      let second = null
      let third = null
      if (features.strips[strip][0]) first = features.strips[strip][0]
      if (features.strips[strip][1]) second = features.strips[strip][1]
      if (features.strips[strip][2]) third = features.strips[strip][2]

      //  If there are three skies and NONE of them are textured, then we may texture some of them
      if (third !== null && second !== null && !first.textured && !second.textured && !third.textured) {
        const textureChance = fxrand()
        if (textureChance < 0.5) second.textured = true
        if (textureChance > 0.75) first.textured = true
      }

      //  If there are two skies, we _may_ shade the outer one
      if (third === null && second !== null && !first.textured && !second.textured) {
        if (fxrand() < 0.6) first.textured = true
      }

      //  Set the speeds
      if (!third && !second) first.speed = 'fast'
      if (!third && second && first) {
        first.speed = 'medium'
        second.speed = 'fast'
      }
      if (third && second && first) {
        first.speed = 'slow'
        second.speed = 'medium'
        third.speed = 'fast'
      }
    }
  }

  /* #########################################################################
   *
   * SEA
   *
   * ###################################################################### */
  // const seaCount = 0

  //  Reset the colours, but this time we don't reset between strips
  thisColour = 'dark'
  oldColour1 = 'dark'
  oldColour2 = null
  for (const i in features.land) {
    //  If this thing is a sky, then we do sky things
    if (features.land[i] === 'C') {
      //  Work out how many cures we are going to have
      const target = 4

      //  I want to keep track of which starting (middle) and end points have been used
      //  so we don't use each one twice. There are a few ways of doing this, but I'm
      //  going to go for the fairly long-winded way of tracking them
      const started = []
      const ended = []

      //  Now we know how many curves there will be we need to make them
      for (let t = 0; t < target; t++) {
        const curve = {}
        //  Add the default features
        curve.mode = 'full'
        curve.textured = false
        curve.texture = 1

        //  The starting and ending postion can be in any of five points
        //  Top, Bottom, Middle and the two quarter points
        curve.start = Math.floor(fxrand() * 5) * 0.25
        curve.end = curve.start
        //  The end can't match the start
        while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
        //  Now do it all over again, until we know we've used points that
        //  haven't already been used
        while (started.includes(curve.start) || ended.includes(curve.end)) {
          curve.start = Math.floor(fxrand() * 5) * 0.25
          curve.end = curve.start
          while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
        }
        //  Record the start and end point so we don't use them again
        started.push(curve.start)
        ended.push(curve.end)

        //  Store the curve
        features.strips[i].push(curve)
      }
      //  Sort them into "largest" to "smallest", so we draw back to front
      features.strips[i] = features.strips[i].sort((a, b) => ((a.start + a.end) < (b.start + b.end)) ? 1 : (((b.start + b.end) < (a.start + a.end)) ? -1 : 0))
      //  Now go through all of them turning the textured ones back into dark and adding the texture
      for (const wave of features.strips[i]) {
        if (wave.colour === 'textured') {
          wave.colour = 'dark'
          // wave.textured = true
        }
      }
    }
  }

  //  Work out where the shoreline is
  features.shore = 4
  if (features.land[0] !== 'C' && features.land[1] === 'C') features.shore = 1
  if (features.land[1] !== 'C' && features.land[2] === 'C') features.shore = 2
  if (features.land[2] !== 'C' && features.land[3] === 'C') features.shore = 3

  //  Now we do the land
  //  We are starting the colours *OUTSIDE* of the loop, so we can move from one to the next

  /* #########################################################################
   *
   * LAND
   *
   * ###################################################################### */

  // TODO: Calculate the top colour from the first strip of sea we have
  //  Reset the colours, but again don't reset between strips
  thisColour = 'dark'
  oldColour1 = 'dark'
  oldColour2 = null
  for (const i in features.land) {
    //  If this thing is a sky, then we do sky things
    if (features.land[i] === 'L') {
      let target = 2
      if (fxrand() < 0.4) {
        target = 3
        if (fxrand() < 0.1) target = 1
      }

      //  I want to keep track of which starting (middle) and end points have been used
      //  so we don't use each one twice. There are a few ways of doing this, but I'm
      //  going to go for the fairly long-winded way of tracking them
      const started = []
      const ended = []

      //  Now we know how many curves there will be we need to make them
      for (let t = 0; t < target; t++) {
        const curve = {}
        //  Add the default features
        curve.mode = 'full'
        curve.flipped = false
        curve.textured = false
        curve.texture = 1

        //  The starting and ending postion can be in any of five points
        //  Top, Bottom, Middle and the two quarter points
        curve.start = Math.floor(fxrand() * 5) * 0.25
        curve.end = curve.start
        //  The end can't match the start
        while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
        //  Now do it all over again, until we know we've used points that
        //  haven't already been used
        while (started.includes(curve.start) || ended.includes(curve.end)) {
          curve.start = Math.floor(fxrand() * 5) * 0.25
          curve.end = curve.start
          while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
        }
        //  Record the start and end point so we don't use them again
        started.push(curve.start)
        ended.push(curve.end)

        //  Work out the colours
        while (thisColour === oldColour1 || thisColour === oldColour2) {
          thisColour = features.palette[Math.floor(fxrand() * features.palette.length)]
        }
        oldColour2 = oldColour1
        oldColour1 = thisColour
        curve.colour = thisColour

        if (fxrand() < 0.2) {
          curve.mode = 'half'
          curve.middle = curve.start
          if (fxrand() < 0.5) curve.middle = curve.end
        }

        //  Store the curve
        features.strips[i].push(curve)
      }
      //  Sort them into "largest" to "smallest", so we draw back to front
      features.strips[i] = features.strips[i].sort((a, b) => ((b.start + b.end) < (a.start + a.end)) ? 1 : (((a.start + a.end) < (b.start + b.end)) ? -1 : 0))
    }
  }

  /* #########################################################################
   *
   * SEA TWO
   *
   * ###################################################################### */
  //  Now we want to colour the sea, but we need to work out a little bit of land first
  //  Now do the colours, starting from the top strip and working our way down the land
  //  grabbing the last colour used.
  thisColour = 'dark'
  oldColour1 = 'dark'
  oldColour2 = null
  for (const i in features.land) {
    //  If this thing is a sky, then we do sky things
    if (features.land[i] === 'L') {
      for (const land of features.strips[i]) {
        thisColour = land.colour
        oldColour1 = land.colour
        oldColour2 = null
      }
    }
  }

  for (const i in features.land) {
    //  If this thing is a sky, then we do sky things
    if (features.land[i] === 'C') {
      for (let w = features.strips[i].length - 1; w >= 0; w--) {
        //  Work out the colours
        while (thisColour === oldColour1 || thisColour === oldColour2) {
          thisColour = palette[Math.floor(fxrand() * palette.length)]
        }
        oldColour2 = oldColour1
        oldColour1 = thisColour
        features.strips[i][w].colour = thisColour
        if (fxrand() < 0.75) features.strips[i][w].textured = true
      }
    }
  }
  console.table(features)
}

const init = async () => {
  makeFeatures()
  await layoutCanvas()
  drawCanvas()
}

const layoutCanvas = async () => {
  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  cHeight = Math.floor(cHeight / 8) * 8
  const canvas = document.getElementById('target')
  canvas.width = cWidth
  canvas.height = cHeight
  canvas.style.position = 'absolute'
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  Load in the clouds
  const cloudImg1 = new Image()
  cloudImg1.src = cloud1
  let base64Response = await fetch(cloud1)
  let blob = await base64Response.blob()
  features.cloud1 = await createImageBitmap(blob, 0, 0, 512, 512, {
    resizeWidth: canvas.width / 6,
    resizeQuality: 'medium'
  })

  //  Load in the clouds
  const waterImg1 = new Image()
  waterImg1.src = water1
  base64Response = await fetch(water1)
  blob = await base64Response.blob()
  features.water1 = await createImageBitmap(blob, 0, 0, 1024, 1024, {
    resizeWidth: canvas.width / 3,
    resizeQuality: 'medium'
  })
}

//  Draw the cloud for a strip
const drawCloud = (ctx, cloud, stripSize, edge, left, right, middle) => {
  const cloud1pattern = ctx.createPattern(features.cloud1, 'repeat')
  const diff = new Date().getTime() - startTime

  let start = null
  let midd = null
  let end = null
  let cmodmod = 1
  if (cloud.mode === 'half') cmodmod = 2

  if (!cloud.flipped) {
    edge += stripSize
    start = edge + (stripSize * -1) * cloud.start
    midd = edge + (stripSize * -1) * cloud.middle
    end = edge + (stripSize * -1) * cloud.end
  }

  if (cloud.flipped) {
    start = edge + (stripSize * 1) * cloud.start * 0.8
    midd = edge + (stripSize * 1) * cloud.middle * 0.8
    end = edge + (stripSize * 1) * cloud.end * 0.8
  }

  //  Draw each one twice, but only do it the second time if we are textured
  let y = null
  for (let l = 0; l <= 1; l++) {
    if (l === 0 || (l === 1 && cloud.textured)) {
      ctx.fillStyle = features.palettes[features.country][cloud.colour]
      //  Set to default source over
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0

      //  If we are using a texture, do that now
      if (l === 1 && cloud.textured) {
        ctx.fillStyle = cloud1pattern
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.5
        if (cloud.colour === 'dark') ctx.globalAlpha = 1.0
        if (cloud.colour === 'light') ctx.globalAlpha = 0.25
      }

      ctx.beginPath()
      ctx.moveTo(left, edge)
      //  Now we need to step through the points from the start to the end
      for (let i = 0; i <= 1.01; i += 0.01) {
        const cmod = (Math.sin(((180 * i * cmodmod) + (90 + diff / features.speed[cloud.speed])) * (Math.PI / 180)) + 1) / 2
        // if (cloud.mode === 'half') {
        // let cmod = (Math.sin(((180 * i) + 90) * (Math.PI / 180)) + 1) / 2
        // }
        //  If we are drawing a full cloud then we have to do this
        y = end - ((end - start) * cmod)
        ctx.lineTo(left + ((right - left) * i), y)
      }
      // ctx.lineTo(right, y)

      ctx.lineTo(right, edge)
      ctx.closePath()
      ctx.fill()
      //  Reset it back
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0
    }
  }
  // ctx.stroke()
}

//  Draw a wave for a strip
const drawWave = (ctx, wave, stripSize, shore, top, left, right, middle) => {
  const water1pattern = ctx.createPattern(features.water1, 'repeat')

  let start = null
  let end = null
  let cmodmod = 1
  if (wave.mode === 'half') cmodmod = 2

  start = top + (wave.start * stripSize)
  end = top + (wave.end * stripSize)
  if (wave.shrink) {
    start = top + (wave.start * 0.8 * stripSize)
    end = top + (wave.end * 0.8 * stripSize)
  }

  for (let l = 0; l <= 1; l++) {
    if (l === 0 || (l === 1 && wave.textured)) {
      //  Standard fill stuff
      ctx.fillStyle = features.palettes[features.country][wave.colour]
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0

      //  If we are using a texture, do that now
      if (l === 1 && wave.textured) {
        ctx.fillStyle = water1pattern
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.5
        if (wave.colour === 'dark') ctx.globalAlpha = 0.75
        if (wave.colour === 'light') ctx.globalAlpha = 0.25
      }

      ctx.beginPath()
      ctx.moveTo(left, shore)
      let y = end
      for (let i = 0; i <= 1; i += 0.01) {
        const cmod = (Math.sin(((180 * i * cmodmod) + 90) * (Math.PI / 180)) + 1) / 2
        y = end - ((end - start) * cmod)
        ctx.lineTo(left + ((right - left) * i), y)
      }
      ctx.lineTo(right, y)
      ctx.lineTo(right, shore)
      ctx.closePath()
      ctx.fill()
      //  Reset it back
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0
    }
  }
}

//  Draw the land for a strip
const drawLand = (ctx, land, stripSize, shore, bottom, left, right, middle) => {
  const start = bottom + (stripSize * land.start)
  const midd = bottom + (stripSize * land.middle)
  const end = bottom + (stripSize * land.end)
  let cmodmod = 1
  if (land.mode === 'half') cmodmod = 2

  let y = null
  for (let l = 0; l <= 1; l++) {
    if (l === 0 || (l === 1 && land.textured)) {
      ctx.fillStyle = features.palettes[features.country][land.colour]
      //  Set to default source over
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0

      ctx.beginPath()
      ctx.moveTo(left, shore)
      //  Now we need to step through the points from the start to the end
      for (let i = 0; i <= 1; i += 0.01) {
        const cmod = (Math.sin(((180 * i * cmodmod) + 90) * (Math.PI / 180)) + 1) / 2
        // if (land.mode === 'half') {
        // let cmod = (Math.sin(((180 * i) + 90) * (Math.PI / 180)) + 1) / 2
        // }
        //  If we are drawing a full land then we have to do this
        if (land.mode === 'full') {
          y = end - ((end - start) * cmod)
          ctx.lineTo(left + ((right - left) * i), y)
        } else {
          //  Otherwise we have to draw the first half of the land first and then
          //  the second half
          if (start !== midd) {
            if (i <= 0.5) {
              y = midd - ((midd - start) * cmod)
              ctx.lineTo((left + ((right - left) * i)), y)
            } else {
              y = end
              ctx.lineTo((left + ((right - left) * i)) + middle, y)
            }
          }
          if (midd !== end) {
            if (i <= 0.5) {
              y = midd
              ctx.lineTo((left + ((right - left) * i)), y)
            } else {
              y = midd - ((midd - end) * cmod)
              ctx.lineTo((left + ((right - left) * (i - 0.5))) + middle, y)
            }
          }
        }
      }
      ctx.lineTo(right, y)

      ctx.lineTo(right, shore)
      ctx.closePath()
      ctx.fill()
      //  Reset it back
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0
    }
  }
}

const drawCanvas = async () => {
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const water1pattern = ctx.createPattern(features.water1, 'repeat')

  //  Now draw the rectangles
  /*
  const landMap = {
    S: 'SKY',
    L: 'LAND',
    C: 'SEA'
  }
  */
  features.ctx = ctx
  // const toggle = 0

  //   DEAL WITH THE SKY FIRST
  for (let strip = 0; strip < 4; strip++) {
    //  Just to make things a little easier, let's work out where our
    //  corners are
    const stripSize = canvas.height / 4
    const top = stripSize * strip
    // const bottom = top + stripSize
    const left = 0
    const right = canvas.width
    const middle = canvas.width / 2

    //  If we are drawing the sky, do it one way
    //  otherwise keep going the old fashioned way
    if (features.land[strip] === 'S') {
      //  Loop through the curves drawing them
      for (const cloud of features.strips[strip]) {
        //  Now draw the cloud
        //  if we aren't the last sky, then draw the fills from the bottom of the
        //  strip up, otherwise draw them from the top of the strip down
        drawCloud(ctx, cloud, stripSize, top, left, right, middle)
      }
    }
  }

  //   NOW TO THE SEA
  ctx.fillStyle = features.palettes[features.country].dark
  for (let strip = 3; strip >= 0; strip--) {
    //  Just to make things a little easier, let's work out where our
    //  corners are
    const stripSize = canvas.height / 4
    const shore = stripSize * features.shore
    const top = stripSize * strip
    const left = 0
    const right = canvas.width
    const middle = canvas.width / 2

    if (features.land[strip] === 'C') {
      //  If the last thing we drew was a textured pattern, then we need to fill
      //  the rectange in with dark blue first, and then over the top again with the
      // texture
      // let redrawTexture = false
      // if (typeof (ctx.fillStyle) === 'object') redrawTexture = true
      //  Draw the rectangle
      if (strip === 3) {
        ctx.fillStyle = features.palettes[features.country].dark
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0
        ctx.fillRect(0, canvas.height / 4 * strip, canvas.width, canvas.height / 4)
      }
      /*

      //  Draw the texture
      ctx.fillStyle = water1pattern
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 1.0
      ctx.fillRect(0, canvas.height / 4 * strip, canvas.width, canvas.height / 4)

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0
      */
      //  Loop through the curves drawing them
      for (const wave of features.strips[strip]) {
        if (strip === 3) {
          wave.shrink = true
        }
        drawWave(ctx, wave, stripSize, shore, top, left, right, middle)
      }
    }
  }

  //   FINALLY THE LAND
  for (let strip = 0; strip < 4; strip++) {
    const stripSize = canvas.height / 4
    const shore = stripSize * features.shore
    const bottom = stripSize * (strip)
    const left = 0
    const right = canvas.width
    const middle = canvas.width / 2

    if (features.land[strip] === 'L') {
      for (const land of features.strips[strip]) {
        drawLand(ctx, land, stripSize, shore, bottom, left, right, middle)
      }
    }
  }

  // autoDownloadCanvas()
  setTimeout(() => {
    // makeFeatures()
    drawCanvas()
  }, 66)
}
init()
// autoDownloadCanvas()
window.addEventListener('resize', async () => {
  await layoutCanvas()
  drawCanvas()
})
