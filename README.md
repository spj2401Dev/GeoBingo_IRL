# Geobingo

Geobingo is an open-source game where you and your friends are assigned prompts to find and photograph objects in the real world.

![341911509-0eaa7ef9-b24a-423d-84e2-2cf84628e70a(1)](https://github.com/user-attachments/assets/452337b7-57d9-4aaf-a175-7e3465c9f785)
[Brushes from Brusheezy!](https://www.brusheezy.com)

Selfhosting
Download the Repo and open in up in your favorite IDE. Then install all the required packages.

```
npm i
```

After that create a `config.json` file in the root of the project, which should look like this:

```json
  {
   "WebSocket":{
      "Ip":"127.0.0.1",
      "Port":8080
   },
   "Api":{
      "Ip":"127.0.0.1",
      "Port":8000
   }
}
```

Like this its configured to run on your localhost. Then you just have to configure the Client to connect to the right WebSocket. Go to /client/resources/webSocketService.mjs. There you should see an IP adresse. Just change this to the same then you configured in the config.json
After that just run the project using

```
npm start
```

or use nodemon, to automatically restart the server once you saved a file. (Often not recommended, because all the game data is stored in the runtime. Meaning restarting the server resets the game)

```
npm run dev
```

### Setting Default words

In GeoBingo you can set default words, which will be randomly choosen if you dont fill out all the words. You can find those in /src/utility/wordsList.mjs. In there just put the Words you want to use.

# Features

- 🤝 Teams are supported. Play with multiple people together
- 📝 Voting. Give extra points to the best photos.
- 🔎 As Admin remove pictures that do not follow the prompt.
- 🔗 Compression Build in. Save Data when on the run
- 💻 Good looking UI

## Contributing

Contributions are always welcome!

There are still a lot of issues in terms of security, since the was programmed in about two Weeks and is only meant for Friends.

If you have any ideas for improvements, just create a Pull Request :)

## License

[MIT](https://choosealicense.com/licenses/mit/)
