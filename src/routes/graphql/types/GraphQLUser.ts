import { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';

export const GraphQLUser = new GraphQLObjectType({
	name: 'GraphQLUser',
	fields: () => ({
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		email: { type: GraphQLString },
		subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
	}),
});
