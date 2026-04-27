from pymongo import MongoClient

c = MongoClient('mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority')
db = c['news_aggregator']

for col_name in ['raw_news_data', 'test_v2']:
    pipeline = [
        {'$group': {'_id': '$title', 'count': {'$sum': 1}}},
        {'$match': {'count': {'$gt': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 5}
    ]
    duplicates = list(db[col_name].aggregate(pipeline))
    
    total_dups = sum(d['count'] - 1 for d in list(db[col_name].aggregate([
        {'$group': {'_id': '$title', 'count': {'$sum': 1}}},
        {'$match': {'count': {'$gt': 1}}}
    ])))
    
    print(f'\nCollection: {col_name}')
    print(f'Total duplicate extra articles: {total_dups}')
    if duplicates:
        print('Top 5 most duplicated titles:')
        for d in duplicates:
            print(f'  - [{d["count"]}x] {str(d["_id"])[:80]}...')
