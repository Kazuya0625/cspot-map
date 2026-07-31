import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

type Spot = {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  createdAt: string;
};

const connectionString = process.env.COSMOS_CONNECTION;
const databaseId = process.env.COSMOS_DATABASE;
const containerId = process.env.COSMOS_CONTAINER;

if (!connectionString || !databaseId || !containerId) {
  throw new Error(
    "Cosmos DBの環境変数が設定されていません。",
  );
}


console.log({
  hasConnectionString: Boolean(connectionString),
  connectionStringLength: connectionString?.length,
  databaseId,
  containerId,
});



const cosmosClient = new CosmosClient(connectionString);

const container = cosmosClient
  .database(databaseId)
  .container(containerId);

export async function spotsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`${request.method} /api/spots`);

  try {
    if (request.method === "GET") {
      const { resources } = await container.items
        .query<Spot>({
          query: "SELECT * FROM c ORDER BY c.createdAt DESC",
        })
        .fetchAll();

      return {
        status: 200,
        jsonBody: resources,
      };
    }

    if (request.method === "POST") {
      const body = (await request.json()) as Partial<Spot>;

      if (
        !body.title?.trim() ||
        !body.description?.trim() ||
        !body.category ||
        typeof body.latitude !== "number" ||
        typeof body.longitude !== "number"
      ) {
        return {
          status: 400,
          jsonBody: {
            message: "入力内容が不足しています。",
          },
        };
      }

      const newSpot: Spot = {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        description: body.description.trim(),
        category: body.category,
        latitude: body.latitude,
        longitude: body.longitude,
        createdAt: new Date().toISOString(),
      };

      const { resource } =
        await container.items.create<Spot>(newSpot);

      return {
        status: 201,
        jsonBody: resource,
      };
    }

        if (request.method === "DELETE") {
      const id = request.params.id;
      const category = request.query.get("category");

      if (!id || !category) {
        return {
          status: 400,
          jsonBody: {
            message: "スポットIDまたはカテゴリが不足しています。",
          },
        };
      }

      await container.item(id, category).delete();

      return {
        status: 204,
      };
    }

    return {
      status: 405,
      jsonBody: {
        message: "許可されていないHTTPメソッドです。",
      },
    };
  } catch (error) {
    context.error("Cosmos DBの処理に失敗しました。", error);

    return {
      status: 500,
      jsonBody: {
        message: "サーバー内部でエラーが発生しました。",
      },
    };
  }
}

app.http("spots", {
  methods: ["GET", "POST", "DELETE"],
  authLevel: "anonymous",
  route: "spots/{id?}",
  handler: spotsHandler,
});