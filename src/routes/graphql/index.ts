import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
	DocumentNode,
	graphql,
	GraphQLSchema,
	parse,
	Source,
	validate,
} from 'graphql';
import { RootMutation } from './mutations';
import { RootQuery } from './query';
import { graphqlBodySchema } from './schema';
import * as depthLimit from 'graphql-depth-limit';

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
		async function (request, reply) {
			const schema: GraphQLSchema = new GraphQLSchema({
				query: RootQuery,
				mutation: RootMutation,
			});

			let document: DocumentNode;

			try {
				document = parse(
					new Source(String(request.body.query), 'GraphQL request')
				);
			} catch (error) {
				return fastify.httpErrors.badRequest((error as Error).message);
			}

			const errors = validate(schema, document, [depthLimit(6)]);

			if (errors.length > 0) {
				return reply.send({ data: null, errors: errors });
			}

			return await graphql({
				schema: schema,
				source: String(request.body.query),
				contextValue: fastify,
			});
		}
	);
};

export default plugin;
