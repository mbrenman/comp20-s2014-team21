# User Authentication With Passport.js

- In this post I’ll demonstrate how to add user authentication to Node.js with Passport.js. 
- View the blog post here: http://mherman.org/blog/2013/11/11/user-authentication-with-passport-dot-js/

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