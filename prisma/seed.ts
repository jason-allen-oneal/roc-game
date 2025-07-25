import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Research data from insert_data.sql
const researchData = [
  {
    id: 1,
    name: 'Woodworking',
    slug: 'woodworking',
    requirements: {},
    costs: { f: 500, w: 500, o: 500 },
    description: 'Woodworking allows better lumber production, as well as governing which troops you can train.',
    power: 300,
    baseValue: 10,
    bonusValue: 5
  },
  {
    id: 2,
    name: 'Farming',
    slug: 'farming',
    requirements: {},
    costs: { f: 500, w: 500, s: 500 },
    description: 'Enhance your crop yields and feed a growing population.',
    power: 300,
    baseValue: 10,
    bonusValue: 5
  },
  {
    id: 3,
    name: 'Mining',
    slug: 'mining',
    requirements: {},
    costs: { f: 500, w: 1000 },
    description: 'Dig deeper and harvest more stone and ore from the earth.',
    power: 300,
    baseValue: 10,
    bonusValue: 5
  },
  {
    id: 4,
    name: 'Fletching',
    slug: 'fletching',
    requirements: {},
    costs: { f: 1000, w: 1000, s: 500, o: 500 },
    description: 'Fletching allows the training of ranged troops, as well as increasing the range.',
    power: 600,
    baseValue: 30,
    bonusValue: 2
  },
  {
    id: 5,
    name: 'Architecture',
    slug: 'architecture',
    requirements: {},
    costs: { f: 1000, w: 2000, s: 1000, o: 500 },
    description: 'Refine your blueprints to build faster and smarter.',
    power: 500,
    baseValue: 20,
    bonusValue: 2
  },
  {
    id: 6,
    name: 'Metallurgy',
    slug: 'metallurgy',
    requirements: { buildings: { smith: 1, mine: 1 }, research: { mining: 1 } },
    costs: { f: 1000, w: 1000, s: 500, o: 2000 },
    description: 'Metallurgy allows the crafting of metal objects, such as weapons.',
    power: 600,
    baseValue: 30,
    bonusValue: 2
  },
  {
    id: 7,
    name: 'Craftsmanship',
    slug: 'craftsmanship',
    requirements: { buildings: { lumber: 1 } },
    costs: { f: 1000, w: 2000, s: 1000, o: 500 },
    description: 'Craftsmanship is the ability to build things, such as siege engines.',
    power: 400,
    baseValue: 40,
    bonusValue: 5
  },
  {
    id: 8,
    name: 'Conscription',
    slug: 'conscription',
    requirements: { age: 2, buildings: { barracks: 1, house: 1 } },
    costs: { f: 2000, w: 1000 },
    description: 'Conscription reduces the the time required to train troops.',
    power: 400,
    baseValue: 20,
    bonusValue: 5
  },
  {
    id: 9,
    name: 'Mysticism',
    slug: 'mysticism',
    requirements: { age: 2 },
    costs: { f: 2000, w: 2000, s: 1000, o: 1000 },
    description: 'Mysticism allows the building of the cathedral, as well as the ability to train Monk units.',
    power: 500,
    baseValue: 20,
    bonusValue: 5
  },
  {
    id: 10,
    name: 'Medicine',
    slug: 'medicine',
    requirements: { age: 2 },
    costs: { f: 3000, w: 2000, s: 1000, o: 1000 },
    description: 'Medicine grants Monk units the ability to heal other units.',
    power: 500,
    baseValue: 30,
    bonusValue: 5
  },
  {
    id: 11,
    name: 'Engineering',
    slug: 'engineering',
    requirements: { age: 2 },
    costs: { f: 2000, w: 2000, s: 3000, o: 2000 },
    description: 'Engineering grants the ability to build siege units.',
    power: 600,
    baseValue: 40,
    bonusValue: 5
  },
  {
    id: 12,
    name: 'Ballistics',
    slug: 'ballistics',
    requirements: { age: 3 },
    costs: { f: 2000, w: 3000, s: 2000, o: 3000 },
    description: 'Ballistics improves the accuracy of ranged units, as well as granting the ability to train some units.',
    power: 600,
    baseValue: 40,
    bonusValue: 5
  },
  {
    id: 13,
    name: 'Hoardings',
    slug: 'hoardings',
    requirements: { age: 2, buildings: { storage: 3 } },
    costs: { f: 3000, w: 3000, s: 3000, o: 3000, g: 1000 },
    description: 'Hoardings allows more protection of resources.',
    power: 500,
    baseValue: 30,
    bonusValue: 5
  },
  {
    id: 14,
    name: 'Banking',
    slug: 'banking',
    requirements: { age: 2, buildings: { trade: 3 }, research: { hoardings: 1 } },
    costs: { f: 3000, w: 3000, s: 3000, o: 3000, g: 3000 },
    description: 'Banking reduces the cost of trade.',
    power: 300,
    baseValue: 20,
    bonusValue: 5
  }
]

// Building data from insert_data.sql
const buildingData = [
  {
    id: 1,
    name: 'Arena',
    fieldType: 0,
    description: 'The arena is a large enclosed platform, designed to showcase theatre, musical performances, or sporting events. It is composed of a large open space surrounded on all sides by tiered seating for spectators. The arena is designed to accommodate a multitude of spectators.',
    costs: { f: 100, w: 500, s: 400, o: 0, g: 25 },
    requirements: { age: 1 },
    slug: 'arena',
    power: 500,
    baseValue: 0,
    bonusValue: 10
  },
  {
    id: 2,
    name: 'Barracks',
    fieldType: 0,
    description: 'Train your troops in the Barracks. Stronger troops require a higher level of Barracks. Building more Barracks will speed up Training.',
    costs: { f: 400, w: 300, s: 300, o: 0, g: 25 },
    requirements: { age: 1 },
    slug: 'barracks',
    power: 100,
    baseValue: 1,
    bonusValue: 10
  },
  {
    id: 3,
    name: 'Academy',
    fieldType: 0,
    description: 'The academy is where to research new and better Technologies. Upgrading the Academy allows your alchemists to engage in more complicated research.',
    costs: { f: 1500, w: 500, s: 1500, o: 500, g: 200 },
    requirements: { age: 1 },
    slug: 'academy',
    power: 600,
    baseValue: 0,
    bonusValue: 0
  },
  {
    id: 4,
    name: 'Cathedral',
    fieldType: 0,
    description: 'The cathedral is the center of religion for your empire. You can train Monks for healing.',
    costs: { f: 1000, w: 500, s: 1000, o: 500, g: 100 },
    requirements: { age: 2, research: { mysticism: 1 } },
    slug: 'cathedral',
    power: 800,
    baseValue: 1,
    bonusValue: 0
  },
  {
    id: 5,
    name: 'Towncenter',
    fieldType: 0,
    description: 'This is the center of your city! You can see what is needed and your approval ratings.',
    costs: { f: 2000, w: 5000, s: 3000, o: 500, g: 500 },
    requirements: { age: 1 },
    slug: 'towncenter',
    power: 100,
    baseValue: 0,
    bonusValue: 0
  },
  {
    id: 6,
    name: 'House',
    fieldType: 0,
    description: 'Houses provide a place for your subjects to live. Upgrade to provide better houses, and raise your Population.',
    costs: { f: 100, w: 500, s: 100, o: 0 },
    requirements: { age: 1 },
    slug: 'house',
    power: 50,
    baseValue: 1,
    bonusValue: 5
  },
  {
    id: 7,
    name: 'Blacksmith',
    fieldType: 0,
    description: 'The Blacksmith creates all the metal weapons and armor for your troops. A higher level Blacksmith is needed for more advanced weaponry and armor.',
    costs: { f: 100, w: 500, s: 500, o: 400, g: 0 },
    requirements: { age: 1 },
    slug: 'smith',
    power: 200,
    baseValue: 1,
    bonusValue: 5
  },
  {
    id: 8,
    name: 'Archery Range',
    fieldType: 0,
    description: 'The Archery Range allows you to train ranged combat troops.',
    costs: { f: 400, w: 300, s: 300, o: 100, g: 50 },
    requirements: { age: 1 },
    slug: 'archery',
    power: 100,
    baseValue: 1,
    bonusValue: 10
  },
  {
    id: 9,
    name: 'Market',
    fieldType: 0,
    description: 'The Market is a gathering spot for buying and selling Resources between players. Upgrade your Market to enact multiple transactions at the same time.',
    costs: { f: 250, w: 250, s: 250, o: 250, g: 100 },
    requirements: { age: 1 },
    slug: 'market',
    power: 100,
    baseValue: 40,
    bonusValue: 5
  },
  {
    id: 10,
    name: 'Stable',
    fieldType: 0,
    description: 'Stables are necessary to house the horses used by Cavalry and Heavy Cavalry. Upgrade your Stables to research higher levels.',
    costs: { f: 600, w: 200, o: 0, g: 25 },
    requirements: { age: 1 },
    slug: 'stable',
    power: 100,
    baseValue: 1,
    bonusValue: 10
  },
  {
    id: 11,
    name: 'Tower',
    fieldType: 0,
    description: 'The Tower is used to send early warnings of invasions. The higher its level, the more detailed information you gain.',
    costs: { f: 0, w: 500, s: 500, o: 100, g: 100 },
    requirements: { age: 1 },
    slug: 'tower',
    power: 400,
    baseValue: 0,
    bonusValue: 0
  },
  {
    id: 12,
    name: 'Storehouse',
    fieldType: 0,
    description: 'The Storehouse protects your Food, Wood, Stone, Ore, and Gold from being Plundered by your enemies. Upgrade your Storehouse to protect more Resources.',
    costs: { f: 300, w: 300, s: 100, g: 100 },
    requirements: { age: 1 },
    slug: 'storage',
    power: 200,
    baseValue: 0,
    bonusValue: 0
  },
  {
    id: 13,
    name: 'Wall',
    fieldType: 0,
    description: 'Walls provide your city with protection. Your Defensive units are built on your Wall. Higher levels allow you to build better Defensive units and increase your city\'s protection.',
    costs: { f: 0, w: 500, s: 500, o: 500, g: 50 },
    requirements: { age: 1 },
    slug: 'wall',
    power: 800,
    baseValue: 0,
    bonusValue: 0
  },
  {
    id: 14,
    name: 'Farm',
    fieldType: 1,
    description: 'Farms produce Food, important for buildings and for feeding your troops. Higher levels produce more Food.',
    costs: { f: 200, w: 200, s: 0, o: 0, g: 0 },
    requirements: { age: 1 },
    slug: 'farm',
    power: 100,
    baseValue: 100,
    bonusValue: 5
  },
  {
    id: 15,
    name: 'Sawmill',
    fieldType: 1,
    description: 'Sawmills produce Wood, necessary for buildings and for training troops.',
    costs: { f: 100, w: 300, s: 0, o: 0, g: 0 },
    requirements: { age: 1 },
    slug: 'lumber',
    power: 100,
    baseValue: 100,
    bonusValue: 5
  },
  {
    id: 16,
    name: 'Mine',
    fieldType: 1,
    description: 'Mines produce Stone and Ore. Stone is the foundation of your buildings, allowing them to withstand attacks and time. Ore is necessary to create any metal your city needs, from weapons to nails.',
    costs: { f: 100, w: 200, s: 100, o: 0, g: 0 },
    requirements: { age: 1 },
    slug: 'mine',
    power: 100,
    baseValue: 100,
    bonusValue: 5
  },
  {
    id: 17,
    name: 'Shrine',
    fieldType: 0,
    description: 'A sacred place that offers blessings to your people. Increases faith and grants random buffs to nearby buildings.',
    costs: { f: 800, w: 300, s: 500, o: 100, g: 75 },
    requirements: { age: 2, research: { mysticism: 2 } },
    slug: 'shrine',
    power: 300,
    baseValue: 0,
    bonusValue: 20
  }
]

// Tile type definitions from create_map.py
const TILE_TYPES = {
  'PLAINS': {
    frequency: 0.35,
    resources: {
      food: { min: 50, max: 100 },
      wood: { min: 20, max: 50 },
      stone: { min: 10, max: 30 },
      gold: { min: 5, max: 15 }
    }
  },
  'FORESTS': {
    frequency: 0.25,
    resources: {
      food: { min: 20, max: 50 },
      wood: { min: 120, max: 200 },
      stone: { min: 5, max: 15 },
      gold: { min: 10, max: 25 }
    }
  },
  'HILLS': {
    frequency: 0.20,
    resources: {
      food: { min: 10, max: 30 },
      wood: { min: 15, max: 50 },
      stone: { min: 100, max: 180 },
      gold: { min: 20, max: 45 }
    }
  },
  'MOUNTAINS': {
    frequency: 0.10,
    resources: {
      food: { min: 2, max: 10 },
      wood: { min: 5, max: 20 },
      stone: { min: 150, max: 300 },
      gold: { min: 80, max: 200 }
    }
  },
  'FOOD': {
    frequency: 0.06,
    resources: {
      food: { min: 150, max: 300 },
      wood: { min: 10, max: 30 },
      stone: { min: 5, max: 20 },
      gold: { min: 5, max: 15 }
    }
  },
  'BARB': {
    frequency: 0.03,
    resources: {
      food: { min: 10, max: 40 },
      wood: { min: 20, max: 60 },
      stone: { min: 40, max: 120 },
      gold: { min: 60, max: 180 }
    }
  },
  'RUINS': {
    frequency: 0.01,
    resources: {
      food: { min: 0, max: 5 },
      wood: { min: 0, max: 10 },
      stone: { min: 100, max: 250 },
      gold: { min: 200, max: 500 }
    }
  }
}

function generateRandomResources(tileType: keyof typeof TILE_TYPES) {
  const resources: any = {}
  const config = TILE_TYPES[tileType]
  
  for (const [resource, rangeConfig] of Object.entries(config.resources)) {
    resources[resource] = Math.floor(Math.random() * (rangeConfig.max - rangeConfig.min + 1)) + rangeConfig.min
  }
  
  return resources
}

function generateMapTiles(kingdomId: number, mapSize: number = 750) {
  const tiles: any[] = []
  const totalTiles = mapSize * mapSize
  
  // Calculate number of tiles for each type
  const tilesToCreate: { [key: string]: number } = {}
  
  for (const [tileType, config] of Object.entries(TILE_TYPES)) {
    const count = Math.floor(totalTiles * config.frequency)
    tilesToCreate[tileType] = count
  }
  
  // Ensure we have exactly the right number of tiles
  let actualTotal = Object.values(tilesToCreate).reduce((sum, count) => sum + count, 0)
  if (actualTotal < totalTiles) {
    tilesToCreate['PLAINS'] += (totalTiles - actualTotal)
  }
  
  // Generate coordinates
  const coordinates: [number, number][] = []
  for (let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
      coordinates.push([x, y])
    }
  }
  
  // Shuffle coordinates
  for (let i = coordinates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[coordinates[i], coordinates[j]] = [coordinates[j], coordinates[i]]
  }
  
  let tileIndex = 0
  for (const [tileType, count] of Object.entries(tilesToCreate)) {
    for (let i = 0; i < count; i++) {
      if (tileIndex >= coordinates.length) break
      
      const [x, y] = coordinates[tileIndex]
      const level = Math.floor(Math.random() * 20) + 1
      
      tiles.push({
        kingdomId,
        type: tileType,
        x,
        y,
        level
      })
      
      tileIndex++
    }
  }
  
  return tiles
}

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.playerResearch.deleteMany()
    await prisma.playerBuilding.deleteMany()
    await prisma.city.deleteMany()
    await prisma.mapTile.deleteMany()
    await prisma.research.deleteMany()
    await prisma.building.deleteMany()
    await prisma.player.deleteMany()
    await prisma.kingdom.deleteMany()
    await prisma.user.deleteMany()


    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'P455w3rd', 12);
    const user = await prisma.user.create({
      data: {
        email: 'jason.allen.oneal@gmail.com',
        password: hashedPassword as unknown as string
      }
    })
    
    // Create test kingdoms
    console.log('🏰 Creating kingdoms...')
    const kingdoms = await Promise.all([
      prisma.kingdom.create({
        data: {
          name: 'Camelot',
          maxPlayers: 2000
        }
      })
    ])
    
    console.log(`✅ Created ${kingdoms.length} kingdoms`)
    
    // Create research data
    console.log('🔬 Creating research data...')
    for (const research of researchData) {
      await prisma.research.create({
        data: {
          id: research.id,
          name: research.name,
          slug: research.slug,
          requirements: research.requirements,
          costs: research.costs,
          description: research.description,
          power: research.power,
          baseValue: research.baseValue,
          bonusValue: research.bonusValue
        }
      })
    }
    console.log(`✅ Created ${researchData.length} research items`)
    
    // Create building data
    console.log('🏗️  Creating building data...')
    for (const building of buildingData) {
      await prisma.building.create({
        data: {
          id: building.id,
          name: building.name,
          fieldType: building.fieldType,
          description: building.description,
          costs: building.costs,
          requirements: building.requirements,
          slug: building.slug,
          power: building.power,
          baseValue: building.baseValue,
          bonusValue: building.bonusValue
        }
      })
    }
    console.log(`✅ Created ${buildingData.length} buildings`)
    
    // Create map tiles for each kingdom
    console.log('🗺️  Creating map tiles...')
    for (const kingdom of kingdoms) {
      console.log(`Creating tiles for ${kingdom.name}...`)
      const tiles = generateMapTiles(kingdom.id, 750)
      
      // Insert tiles in batches to avoid memory issues
      const batchSize = 1000
      for (let i = 0; i < tiles.length; i += batchSize) {
        const batch = tiles.slice(i, i + batchSize)
        await prisma.mapTile.createMany({
          data: batch
        })
      }
      
      console.log(`✅ Created ${tiles.length} tiles for ${kingdom.name}`)
    }
    
    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
