import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphql, GraphQLSchema } from 'graphql';
import { RootMutation } from './mutations';
import { RootQuery } from './query';
import { graphqlBodySchema } from './schema';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.post(
		'/',
		{
			schema: {
				body: graphqlBodySchema,
			},
		},
		async function (request) {
			const schema: GraphQLSchema = new GraphQLSchema({
				query: RootQuery,
				mutation: RootMutation,
			});

			return await graphql({
				schema: schema,
				source: String(request.body.query),
				contextValue: fastify,
			});
		}
	);
};

export default plugin;
