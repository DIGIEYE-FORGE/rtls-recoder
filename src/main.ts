import mqtt from "mqtt";
import env from "./utils/env";
import prisma from "./utils/prisma";

const client = mqtt.connect(env.APTIV_MQTT_CLIENT);

client.on("connect", () => {
  console.log("Connected to MQTT broker", client.connected);

  client.subscribe("rtlsUseCase/IpLHD/events", (err) => {
    if (err) {
      console.error("Error subscribing to topic", err);
      return;
    }
    console.log("Subscribed to topic nxt/");
  });

  client.on("reconnect", () => {
    console.log("Reconnecting to MQTT broker");
  });

  client.on("error", (err) => {
    console.error("Error connecting to MQTT broker", err);
  });
});

type LastTelemetry = {
  name: string;
  value: string | boolean;
};

async function updateDevicelastTelemetries({
  tagId,
  anchor,
  inLine,
  inPoste,
  isStrange,
}: {
  tagId: string;
  anchor: string;
  inLine: boolean;
  inPoste: boolean;
  isStrange: boolean;
}) {
  const lastTelemetries: LastTelemetry[] = [
    {
      name: "anchor",
      value: anchor,
    },
    {
      name: "inLine",
      value: inLine,
    },
    {
      name: "inPoste",
      value: inPoste,
    },
    {
      name: "isStrange",
      value: isStrange,
    },
  ];
  if (inLine)
    lastTelemetries.push({
      name: "lastInLine",
      value: new Date().toISOString(),
    });
  const device = await prisma.device.upsert({
    select: {
      id: true,
      serial: true,
      lastTelemetries: { select: { name: true, value: true } },
    },
    where: { serial: tagId },
    update: {
      lastTelemetries: {
        updateMany: lastTelemetries.map((lastTelemetry) => ({
          where: { name: lastTelemetry.name },
          data: { value: lastTelemetry.value },
        })),
      },
    },
    create: {
      name: tagId,
      serial: tagId,
      deviceProfile: {
        connectOrCreate: {
          where: { name: "rtls-tag" },
          create: {
            name: "rtls-tag",
            deviceType: {
              connectOrCreate: {
                where: { name: "rtls-tag" },
                create: { name: "rtls-tag" },
              },
            },
          },
        },
      },
      lastTelemetries: {
        createMany: {
          data: lastTelemetries,
          skipDuplicates: true,
        },
      },
    },
  });
  if (device && (inLine || inPoste)) {
    await prisma.lastTelemetry.upsert({
      where: { deviceId_name: { deviceId: device.id, name: "lastSeen" } },
      update: {
        value: new Date().toISOString(),
      },
      create: {
        value: new Date().toISOString(),
        name: "lastSeen",
        deviceId: device.id,
      },
    });
  }
  console.log(new Date(), device);
}

client.on("message", async (topic, payload) => {
  try {
    const data: any[] = JSON.parse(payload.toString());

    for (let { tagId, anchor, inLine, inPoste, isStrange } of data) {
      updateDevicelastTelemetries({
        tagId,
        anchor,
        inLine,
        inPoste,
        isStrange,
      });
    }
  } catch (err) {
    console.log(err);
  }
});
