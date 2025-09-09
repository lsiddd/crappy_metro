# Mini Metro Clone 🚇

A web-based clone of the popular Mini Metro game, because apparently we needed another way to procrastinate while pretending to be productive by "optimizing transit systems."

## 🎮 About

Mini Metro is a strategy simulation game where you play urban planner and try not to have a mental breakdown when your carefully designed subway system inevitably turns into spaghetti. Connect stations with railway lines, manage passenger flow, and watch helplessly as tiny geometric shapes judge your life choices. This clone recreates the core gameplay mechanics with HTML5 Canvas and enough JavaScript to make you question your sanity.

## ✨ Features (That Actually Work)

- **Multiple Cities**: Choose from London, Paris, New York, or Tokyo. Each city will disappoint you in unique ways
- **Dynamic Station Generation**: New stations appear over time because the city planner apparently rolled dice to decide where to put things
- **Resource Management**: Juggle trains, carriages, interchanges, and bridges like a very specific type of circus performer
- **Progressive Difficulty**: Each week gets harder, much like real life
- **Upgrade System**: Weekly upgrade choices that won't save you from your poor planning decisions
- **Real-time Simulation**: Watch your empire crumble in beautiful 60fps
- **Responsive Design**: Breaks equally well on desktop and mobile

## 🚀 Getting Started (Good Luck)

### Prerequisites

- Node.js (because even simple games need a JavaScript runtime now)
- A web browser made after 2015
- Patience (not included)
- Realistic expectations (definitely not included)

### Installation

1. Clone the repository (you know the drill):
   ```bash
   cd minihttps://github.com/lsiddd/crappy_metro.git
   ```

2. Install dependencies (all one of them):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Navigate to `http://localhost:3000` and prepare for disappointment

### Alternative Quick Start

Just open `index.html` in your browser if you're feeling rebellious and don't want to use a server for a client-side game.

## 🎯 How to Play (And Lose)

1. **Start the Game**: Pick a city. They're all equally challenging (read: impossible)
2. **Connect Stations**: Draw lines between stations. Try to make it look intentional
3. **Manage Trains**: Drag trains onto lines and hope they know what they're doing
4. **Transport Passengers**: Match the little shapes to their destinations. It's like sorting, but with more anxiety
5. **Expand Your Network**: Use bridges and interchanges while pretending you have a plan
6. **Avoid Overcrowding**: Keep passengers happy or they'll give your metro system 1-star reviews

### Game Elements (The Cast of Characters)

- **Stations**: Different shapes that spawn passengers. Each shape has opinions about where it wants to go
- **Passengers**: Tiny demanding shapes that judge your route planning skills
- **Lines**: The colorful mess you call a "transit system"
- **Trains**: Your faithful servants that somehow make your chaotic network function
- **Resources**: The things you never have enough of (classic game design)

## 🏗️ Project Structure (Organized Chaos)

```
minim/
├── index.html          # The front door
├── styles.css          # Making things pretty (attempt #1)
├── server.js          # Serves files and existential dread
├── js/
│   ├── main.js        # Where dreams go to die (game loop)
│   ├── config.js      # Numbers that seemed reasonable at the time
│   ├── state.js       # Global variables (don't judge)
│   ├── utils.js       # Functions too embarrassing for main.js
│   ├── components/    # The building blocks of chaos
│   │   ├── line.js    # Lines that go places (hopefully)
│   │   ├── passenger.js # Demanding little circles
│   │   ├── river.js   # Wet obstacles that ruin everything
│   │   ├── station.js # Where the magic doesn't happen
│   │   └── train.js   # Choo choo goes the code
│   └── systems/       # Systems (loosely defined)
│       ├── game.js    # The puppet master
│       ├── input.js   # Interpreting human gestures
│       ├── pathfinding.js # Finding routes (narrator: they were not optimal)
│       └── ui.js      # Making buttons do things
```

## 🛠️ Technical Details (For the Curious)

- **Frontend**: Vanilla JavaScript because frameworks are for quitters
- **Backend**: Express.js serving static files like a very expensive file server
- **Architecture**: "Architecture" is a strong word for what we have here
- **Graphics**: Canvas API doing its best with what we give it
- **Input**: Mouse and touch events that somehow work most of the time

## 🎨 Game Configuration (Knobs to Turn)

Mess with `js/config.js` if you want to make the game easier (cheater) or harder (masochist):
- Make stations bigger for people with poor eyesight
- Adjust train speeds for maximum chaos
- Tweak spawn rates to control your suffering
- Change colors because aesthetics matter, apparently

## 📱 Browser Compatibility

Works on:
- Browsers from this decade
- Your phone (probably)
- That old laptop in your closet (maybe)
- Internet Explorer (just kidding, nothing works on IE)

## 🤝 Contributing

Found a bug? Great! Found a feature that could be better? Even better! Want to rewrite the entire thing? Please do, this code has seen things.

1. Fork it (the repo, not the road)
2. Branch it (`git checkout -b feature/my-amazing-idea`)
3. Commit it (`git commit -m 'Fix the thing that was broken'`)
4. Push it (`git push origin feature/my-amazing-idea`)
5. PR it and hope for the best

## 📄 License

**Do Whatever The F*** You Want License**

This code is released under the "Do Whatever The F*** You Want With This Code" license. Seriously. Copy it, steal it, improve it, sell it, tattoo it on your forehead - I don't care. If you make millions, buying me a coffee would be nice but totally optional.

The only requirement: don't blame me when it breaks. It will break. Probably while you're showing it to someone important.

## 🙏 Acknowledgments

- Original Mini Metro by [Dinosaur Polo Club](https://dinopoloclub.com/games/mini-metro/) for creating something so good that people like me feel compelled to poorly recreate it
- Stack Overflow for existing
- Coffee for keeping me functional during development
- My therapist (just kidding, I can't afford therapy)

## 🐛 Known Issues (AKA Features)

- Performance on older devices ranges from "meh" to "slideshow"
- Some features from the original are missing (they'll get here when they get here)
- Occasionally the AI passengers make questionable life choices (relatable)
- The code makes experienced developers cry

## 🔮 Future Plans (Probably Won't Happen)

- [ ] More cities (when I feel like researching transit systems)
- [ ] Sound effects (beep boop noises)
- [ ] Leaderboards (for competitive metro designing)
- [ ] Better AI (the passengers are kinda dumb)
- [ ] Multiplayer (because nothing says fun like arguing about subway routes)
- [ ] Save states (so you can preserve your failures)
- [ ] Achievement system (because everyone needs validation)

*Note: This README took longer to write than some of the actual game features.*
