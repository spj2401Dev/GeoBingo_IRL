
# Geobingo

Geobingo is an open-source game where you and your friends are assigned prompts to find and photograph objects in the real world.

  

![GeoBingoLogoWB](https://github.com/spj2401Dev/GeoBingo/assets/67110757/0eaa7ef9-b24a-423d-84e2-2cf84628e70a)

[Brushes from Brusheezy!](https://www.brusheezy.com)

  

The game is currently still in Development and cannot be played.

  

## How to play anyway (Selfhosting)
Download the Repo and open in up in your favorite IDE. Then install all the required packages.

    npm i
After that create a `config.json` file in the root of the project, which should look like this:

    {
	    "WebSocket": {
		    "Ip": "127.0.0.1",
		    "Port": 8080
		},
	    "Api": {
		    "Ip": "127.0.0.1",
		    "Port": 8000
	    }
    }
Like this its configured to run on your localhost. 
After that just run the project using

    npm start
or use nodemon, to automatically restart the server once you saved a file. (Often not recomended, because all the game data is stored in the runtime. Meaning restarting the server resets the game)

    npm run dev
