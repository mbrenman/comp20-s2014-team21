TODO:
	-Change redirect routes when pushing to Heroku
	-Change mongo connection strings when pushing to Heroku
	-Add charts
	-Change mobile design
	-Figure out emailing API
	-Make collection creation work on MongoLabs
	-Security testing
	-Full system testing

User logins are totally done by passport, so we don’t need to worry about them and their database

Our schemas:

Group:
	Dictionary: {
		“name” : String (the group name),
		“supplies: Dictionary: {
			key: String (the food item)
			value: Dictionary: {
				key: String (group member name)
				value: Int (the number that have been purchased)
			}
		}
	}

User:
	Dictionary: {
		“name”: String
		“groups”: [ list of Strings (associated group names) ]
	}

Curl commands (to test):

Making new groups:

curl -X POST -H "Content-Type: application/json" -d '{"groupname":"testname","members":["matt","Tam","Ariel"],"items":["bread","milk"]}' localhost:3000/newGroup.json

curl -X POST -H "Content-Type: application/json" -d '{"groupname":"newgroup","members":["Brett","Tam","Ariel"],"items":["cheese","bbq"]}' localhost:3000/newGroup.json


Incrementing item count in group:

curl --data "groupname=testname&name=matt&item=bread" localhost:3000/incrementItem.json
