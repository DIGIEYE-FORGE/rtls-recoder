import { PrismaClient, TypeCredential } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const protocols = ['HTTP', 'MQTT', 'COAP'];
type Group = {
  id?: number;
  name: string;
  type?: 'REGION' | 'COUNTRY' | 'PLANT' | 'LINE';
  subGroups?: Group[];
  parentId?: number;
  attributes?: Record<string, any>;
};

const groups: Group[] = [
  {
    name: 'EMEA',
    type: 'REGION',
    subGroups: [
      {
        name: 'Morocco',
        type: 'COUNTRY',
        subGroups: [
          {
            name: 'M7',
            type: 'PLANT',
            attributes: {
              city: 'Tanger',
            },
            subGroups: [
              {
                type: 'LINE',
                name: 'IP LHD',
                attributes: {
                  polygon: [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                  ],
                },
              },
              {
                type: 'LINE',
                name: 'FRANK SP',
                attributes: {
                  polygon: [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                  ],
                },
              },
              {
                type: 'LINE',
                name: 'FRUNC GCL',
                attributes: {
                  polygon: [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                  ],
                },
              },
            ],
          },
          {
            name: 'M1',
            type: 'PLANT',
            attributes: {
              city: 'Tanger',
            },
          },
          {
            name: 'M2',
            type: 'PLANT',
            attributes: {
              city: 'Tanger',
            },
          },
          {
            name: 'M3',
            type: 'PLANT',
            attributes: {
              city: 'Tanger',
            },
          },
          {
            name: 'M4',
            type: 'PLANT',
            attributes: {
              city: 'Meknes',
            },
          },
          {
            name: 'M5',
            type: 'PLANT',
            attributes: {
              city: 'Oujda',
            },
          },
        ],
      },
      {
        name: 'Tunisia',
        type: 'COUNTRY',
      },
      {
        name: 'Romania',
        type: 'COUNTRY',
      },
    ],
  },
  {
    name: 'APAC',
    type: 'REGION',
  },
];

type CreateDeviceTypeInput = {
  id?: number;
  name: string;
};

type CreateDeviceProfileInput = {
  id?: number;
  name: string;
  description?: string;
  logo?: string;
  cridentialsType?: TypeCredential;
  deviceTypeId?: number;
  protocolId?: number;
  decoderId?: number;
  attributes?: any;
};

const deviceTypes: CreateDeviceTypeInput[] = [
  {
    id: 1,
    name: 'GPS',
  },
  {
    id: 2,
    name: 'WEATHER',
  },
  {
    id: 3,
    name: 'CO2Meter',
  },
];

const deviceProfiles: CreateDeviceProfileInput[] = [
  {
    id: 1,
    name: 'GPS',
    description: 'GPS',
    cridentialsType: 'TOKEN',
    deviceTypeId: 1,
  },
  {
    id: 2,
    name: 'WEATHER',
    description: 'WEATHER',
    cridentialsType: 'TOKEN',
    deviceTypeId: 2,
  },
  {
    id: 3,
    name: 'CO2Meter',
    description: 'CO2Meter',
    cridentialsType: 'TOKEN',
    deviceTypeId: 3,
  },
];

async function main() {
  if (process.env.NODE_ENV === 'development') {
    // await prisma.deviceType.deleteMany();
    await seedDeviceTypes();
    await seedDeviceProfiles();
    await prisma.group.deleteMany();
    await seedGroups();
  }
}

main();

async function seedDeviceTypes() {
  try {
    const res = await Promise.all(
      deviceTypes.map(async (deviceType) => {
        return await prisma.deviceType.upsert({
          where: {
            id: deviceType.id,
          },
          update: {
            name: deviceType.name,
          },
          create: {
            name: deviceType.name,
          },
        });
      }),
    );
    console.log('Device Types: ', res);
  } catch (e) {
    console.log(e);
  }
}

async function seedDeviceProfiles() {
  try {
    const res = await Promise.all(
      deviceProfiles.map(async (deviceProfile) => {
        return await prisma.deviceProfile.upsert({
          where: {
            id: deviceProfile.id,
          },
          update: {
            name: deviceProfile.name,
            description: deviceProfile.description,
            cridentialsType: deviceProfile.cridentialsType,
            deviceTypeId: deviceProfile.deviceTypeId,
          },
          create: {
            name: deviceProfile.name,
            description: deviceProfile.description,
            cridentialsType: deviceProfile.cridentialsType,
            deviceTypeId: deviceProfile.deviceTypeId,
          },
        });
      }),
    );
    console.log('Device Profiles: ', res);
  } catch (e) {
    console.log(e);
  }
}

const recursiveCreateGroup = async (group: Group, parentId?: number) => {
  const { name, type, attributes, subGroups } = group;
  const res = await prisma.group.create({
    data: {
      name,
      type,
      attributes,
      parentId,
    },
  });
  if (subGroups) {
    for (const subGroup of subGroups) {
      await recursiveCreateGroup(subGroup, res.id);
    }
  }
};

async function seedGroups() {
  await prisma.machine.findMany({
    select: {
      devices: {
        select: {
          history: {},
        },
        where: {
          deviceProfile: {
            deviceType: {
              name: 'ihm',
            },
          },
        },
      },
    },
  });
  try {
    for (const group of groups) {
      await recursiveCreateGroup(group);
    }
  } catch (e) {
    console.log(e);
  }
  const emea = await prisma.group.findFirst({
    where: {
      name: 'EMEA',
    },
    include: {
      subGroups: {
        include: {
          subGroups: {
            include: {
              subGroups: true,
            },
          },
        },
      },
    },
  });

  console.log('EMEA: ', JSON.stringify(emea, null, 2));
}
