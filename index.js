const ratio = 1.41
const features = {}

const makeFeatures = () => {

  //  These are the combinations of the land we can get, along with the % chance of getting it picked
  /*
  const lands = {
    'SSCC': 3,
    'SLLL': 8,
    'SSLL': 9,
    'SLLC': 16,
    'SSLC': 25,
    'SLCC': 16,
    'LLCC': 10,
    'LLLC': 8,
    'LCCC': 3,
    'SCCC': 2,
  }
  */
  const lands = {
    'SSLC': 100
  }

  const palette = ['dark', 'medium', 'light']

  const palettes = {
    'England': {
      dark: '#F30000',
      medium: '#F37878',
      light: '#F3B6B6'
    },
    'Wales': {
      dark: '#D95C24',
      medium: '#E8A730',
      light: '#F1D726'
    },
    'Scotland': {
      dark: '#425EFF',
      medium: '#A1AFFF',
      light: '#D9DEFF'
    },
    'Ireland': {
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
  for (land in lands) {
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
    for (land in lands) {
      if (landChance >= total) thisLand = land
      total += lands[land]
    }
    tally[thisLand] += 1 / simTimes
    tallyTotal += 1 / simTimes
  }
  const finalTally = []
  for (t in tally) {
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
  country = 'Scotland'

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
  for (i in features.land) {
    //  If this thing is a sky, then we do sky things
    if (features.land[i] === 'S') {
      //  Sometimes we will have 1 curve, other times 3, but most of the time we'll have 2
      let target = 2
      if (fxrand() < 0.5) {
        target = 3
        if (fxrand() < 0.1) target = 1
      }

      let thisColour = 'dark'
      let oldColour1 = 'dark'
      let oldColour2 = null

      //  I want to keep track of which starting (middle) and end points have been used
      //  so we don't use each one twice. There are a few ways of doing this, but I'm
      //  going to go for the fairly long-winded way of tracking them
      const started = []
      const middles = []
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
      features.strips[i] = features.strips[i].sort((a, b) => ((a.start + a.end) < (b.start + b.end)) ? 1 : (((b.start + b.end) < (a.start + b.end)) ? -1 : 0))
    }
  }

  //  If we have two skys, then the first one needs to be marked as not flipped,
  //  and we need to check to see if they have matching middle colours
  let middleHappened = false
  if (features.land[0] === 'S' && features.land[1] === 'S') {
    for (cloud of features.strips[0]) {
      cloud.flipped = false
    }

    //  Check to see the final cloud of the top strip is the same colour as the
    //  final cloud of the bottom strip, if so texture them.
    if (features.strips[0][features.strips[0].length - 1].colour === features.strips[1][features.strips[1].length - 1].colour) {
      features.strips[0][features.strips[0].length - 1].textured = true
      features.strips[1][features.strips[1].length - 1].textured = true
      middleHappened = true
    }
  }

  for (strip in features.land) {
    if (features.land[strip] === 'S') {
      let first = null
      let second = null
      let third = null
      if (features.strips[strip][0]) first = features.strips[strip][0]
      if (features.strips[strip][1]) second = features.strips[strip][1]
      if (features.strips[strip][2]) third = features.strips[strip][2]

      //  If there are three lands and NONE of them are textured, then we may texture some of them
      if (third !== null && second !== null && !first.textured && !second.textured && !third.textured) {
        const textureChance = fxrand()
        if (textureChance < 0.5) second.textured = true
        if (textureChance > 0.75) first.textured = true
      }

      //  If there are two lands, we _may_ shade the outer one
      if (third === null && second !== null && !first.textured && !second.textured) {
        if (fxrand() < 0.6) first.textured = true
      }

      for (cloud of features.strips[strip]) {
        console.log(cloud)
        if (cloud.flipped) {
          //  Sometimes make the curve a half width, but only if it's flipped (for clouds)
          //  Sometimes make the curve a half curve
          if (fxrand() < 0.0) {
            cloud.mode = 'half'
            cloud.middle = cloud.start
            if (fxrand() < 0.5) cloud.middle = cloud.end
          }
        }
      }
    }
  }
  for (i in features.land) {
    const land = features.land[i]
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
  canvas.style.left = `${(wWidth - cWidth)/2}px`
  canvas.style.top = `${(wHeight - cHeight)/2}px`

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

const drawCloud = (ctx, cloud, stripSize, edge, left, right, middle) => {

  console.log('left: ', left)
  console.log('right: ', right)

  const cloud1pattern = ctx.createPattern(features.cloud1, 'repeat')

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
      for (i = 0; i <= 1; i += 0.01) {
        let cmod = (Math.sin(((180 * i * cmodmod) + 90) * (Math.PI / 180)) + 1) / 2
        // if (cloud.mode === 'half') {
        // let cmod = (Math.sin(((180 * i) + 90) * (Math.PI / 180)) + 1) / 2
        // }
        //  If we are drawing a full cloud then we have to do this
        if (cloud.mode === 'full') {
          y = end - ((end - start) * cmod)
          ctx.lineTo(left + ((right - left) * i), y)
        } else {
          //  Otherwise we have to draw the first half of the cloud first and then
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
              console.log(i + ' : ' + cmod + ' : ' + y + 'px')
              ctx.lineTo((left + ((right - left) * (i - 0.5))) + middle, y)
            }
          }
        }
      }
      ctx.lineTo(right, y)

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

const drawCanvas = async () => {
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)



  //  Now draw the rectangles
  const landMap = {
    'S': 'SKY',
    'L': 'LAND',
    'C': 'SEA'
  }
  features.ctx = ctx
  let toggle = 0
  for (strip = 0; strip < 4; strip++) {
    //  Just to make things a little easier, let's work out where our
    //  corners are
    const stripSize = canvas.height / 4
    const top = stripSize * strip
    const bottom = top + stripSize
    const left = 0
    const right = canvas.width
    const middle = canvas.width / 2
    //  If we are drawing the sky, do it one way
    //  otherwise keep going the old fashioned way
    if (features.land[strip] === 'S') {

      //  Loop through the curves drawing them
      for (cloud of features.strips[strip]) {
        //  Now draw the cloud
        //  if we aren't the last sky, then draw the fills from the bottom of the
        //  strip up, otherwise draw them from the top of the strip down
        drawCloud(ctx, cloud, stripSize, top, left, right, middle)
      }

    } else {
      //  Draw the rectangle
      ctx.fillStyle = features.palettes[features.country]['dark']
      if (strip % 2 === 0) ctx.fillStyle = features.palettes[features.country]['light']
      ctx.fillRect(0, canvas.height / 4 * strip, canvas.width, canvas.height / 4 * (strip + 1))

      //  Write the text
      ctx.fillStyle = features.palettes[features.country]['dark']
      if (strip % 2 === 1) ctx.fillStyle = features.palettes[features.country]['light']
      ctx.textAlign = 'center'
      const fontSize = canvas.height / 8
      ctx.font = `bold ${fontSize}px Futura`
      ctx.fillText(landMap[features.land[strip]], canvas.width / 2, (canvas.height / 4 * strip) + (canvas.height / 4 / 2) + (fontSize / 2))

    }
    toggle++
  }
  // autoDownloadCanvas()
  setTimeout(() => {
    makeFeatures()
    drawCanvas()
  }, 800000000000)
}
init()
// autoDownloadCanvas()
window.addEventListener('resize', async () => {
  await layoutCanvas()
  drawCanvas()
})