# Simple pull request template for the team

## Status
**READY/IN DEVELOPMENT/HOLD**


## Description
A few sentences describing the overall goals of the pull request's commits.


## Todos
- [ ] Tests
- [ ] Documentation


## Deploy Notes
Notes regarding deployment the contained body of work.  These should note any
db migrations, etc.


## Exemple
READY/OlivierDenis

Description
Added Eric Website in public directory.

Todos
- [ ] Making it dynamic with rails

Deploy Notes
In Bash use those commands:
$ sudo service mysql start
$ rails server
$ localhost:3000
Need to change the routes.db config (Remove get & root)
