###gitstats

Welcome to my skill demo app, "gitstats".

####Notes

This was written for ES6, using fat arrows and promises and things that ES5 doesn't have.  Any version of Node with ES6
support should work, but I used 8.7.0 since it's what I had installed (and Mike said any version was OK :) )
I have left the ".js" extension on the node script file to make it easier to pull up in an IDE.  Of course, it could be
dropped without issue, and would look more like an actual command.

Installation:  After cloning the repo, simply run ```npm install``` or ```yarn install``` (your choice) and, from the 
command line.

Once the dependencies are situated, you can get documentation by running the application.  On Linux, OS X, NetBSD, 
or (Cthulhu help you) Solaris or another Unix flavor, just type ```./gitstats.js``` on the command line.  On Windows, 
sadly, you must either associate *.js files with Node, or run ```node gitstats.js```.

Adding a -h flag will bring up our handy-dandy help, showing available arguments to make it do what you want it to, 
however it has been pre-configured with "10" for the "N" of "Top-N" and will look at "Netflix" as the default 
organization.

Each argument (in the long form) specified for actual operation can be echoed in a configuration file, which you might 
wish to create on your system.  The path is $HOME/.newt/gitstats.json (which is probably terrible, but I'm showing I 
payed attention during the interview).  This will work under both windows and Linux/UNIX systems.

Example file contents for $HOME/.newt/gitstats.json:
```
{
organization: "apache",
username: "Ferd T Berfel",
password: "This really oughta be a token but they are a pain for a demo. Sorry about clear text password, but optional",
report: "forks",
number: 20
}
```

Each value expressed in this file will override the internal defaults, and in turn is overridden by command-line args.

####Operation
This application has a number of arguments and a flag thrown in for good measure.  All aguments and even the flag are
optional.

#####Flag
-v (--verbose): Makes the program more chatty.  It will inform you if it's found a config file, what the organization
                is, and provide a header for the report.
                   
#####Arguments
-n (--number): The "N" in "Top N"
-o (--organization): The organization to report on
-u (--username): github username (optional) for basic authentication
-p (--password): github password (optional) for basic authentication
-r (--report): report to run.  Options are "stars" for Number of Stars, "forks" for number of forks, "pulls" for 
number of pull requests, and "cont" for contribution percentage (Requests/Forks to the nearest 0.1 percent)

####Tests
There is little to test in this application, and it's definitely not a major piece of art or architecture, so I would
argue that they are not worth the difficulties involved in teasing good tests out (although generally I do love them). 

Therefore, I'm taking the manual testing option.

Running gitstats with no parameters should yield the following:
```
ratwood$ ./gitstats.js
11689	Netflix/Hystrix : https://github.com/Netflix/Hystrix
5967	Netflix/SimianArmy : https://github.com/Netflix/SimianArmy
4327	Netflix/eureka : https://github.com/Netflix/eureka
3379	Netflix/zuul : https://github.com/Netflix/zuul
2181	Netflix/asgard : https://github.com/Netflix/asgard
1767	Netflix/curator : https://github.com/Netflix/curator
1697	Netflix/ribbon : https://github.com/Netflix/ribbon
1483	Netflix/archaius : https://github.com/Netflix/archaius
1167	Netflix/servo : https://github.com/Netflix/servo
965	Netflix/astyanax : https://github.com/Netflix/astyanax
```
This can be corroborated by visiting https://api.github.com/orgs/netflix/repo/hystrix 

Adding -n 3 should limit the number to three:
```
ratwood$ ./gitstats.js -n 3
11689	Netflix/Hystrix : https://github.com/Netflix/Hystrix
5967	Netflix/SimianArmy : https://github.com/Netflix/SimianArmy
4327	Netflix/eureka : https://github.com/Netflix/eureka
```

This format is useful for awk,
but certainly isn't pretty.Adding -v should be a bit more verbose:
```
ratwood$ ./gitstats.js -n 3 -v
Loading from ~/.newt/gitstats.json
Logging in as RobinMack
Organization: netflix
Top 3 repositories by Number of Stars
Stars	Repo Name	:	URL
11689	Netflix/Hystrix : https://github.com/Netflix/Hystrix
5967	Netflix/SimianArmy : https://github.com/Netflix/SimianArmy
4327	Netflix/eureka : https://github.com/Netflix/eurek
```

Let's change the report:
```
ratwood$ ./gitstats.js -n 3 -v -r forks
Loading from ~/.newt/gitstats.json
Logging in as RobinMack
Organization: netflix
Top 3 repositories by Number of Forks
Forks	Repo Name	:	URL
2334	Netflix/Hystrix : https://github.com/Netflix/Hystrix
981	Netflix/eureka : https://github.com/Netflix/eureka
842	Netflix/SimianArmy : https://github.com/Netflix/SimianArmy
```
This can be corroborated by visiting https://api.github.com/orgs/netflix/repo/hystrix

And again:
```
ratwood$ ./gitstats.js -n 3 -v -r pulls
Loading from ~/.newt/gitstats.json
Logging in as RobinMack
Organization: netflix
Top 3 repositories by Number of PullReqs
Pull Reqs	Repo Name	:	URL
83	Netflix/astyanax : https://github.com/Netflix/astyanax
53	Netflix/archaius : https://github.com/Netflix/archaius
48	Netflix/ribbon : https://github.com/Netflix/ribbon
```
This can be corroborated by visiting https://api.github.com/repos/netflix/archaius/pulls
And finally:
```
ratwood$ ./gitstats.js -n 3 -v -r cont
Loading from ~/.newt/gitstats.json
Logging in as RobinMack
Organization: netflix
Top 3 repositories by Contribution Percentage (Requests/Forks)
Con. %	Repo Name	:	URL
87.2	Netflix/brutal : https://github.com/Netflix/brutal
83.3	Netflix/frigga : https://github.com/Netflix/frigga
62.7	Netflix/netflix-commons : https://github.com/Netflix/netflix-commons
```
To corroborate this, divide pull requests by forks and round to the nearest 0.1%
The URLs to look at are https://api.github.com/repos/netflix/brutal/pulls and
https://api.github.com/orgs/netflix/repo/brutal (assuming you haven't already exceeded the request rate limit)

A help for rate limit issues is to save a username and password in the config file (hiding the screen all the while of
course, or using a burner git account)

Thank you for your time and attention!
