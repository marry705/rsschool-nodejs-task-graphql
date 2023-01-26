import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql';

export const MemberType = new GraphQLObjectType({
	name: 'MemberType',
	fields: () => ({
		id: { type: GraphQLString },
		discount: { type: GraphQLInt },
		monthPostsLimit: { type: GraphQLInt },
	}),
});
