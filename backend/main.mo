import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  type Note = {
    name : Text;
    octave : Nat;
  };

  module Note {
    public func compare(n1 : Note, n2 : Note) : Order.Order {
      switch (Text.compare(n1.name, n2.name)) {
        case (#equal) { Nat.compare(n1.octave, n2.octave) };
        case (order) { order };
      };
    };
  };

  type FingeringPattern = [Bool];

  type Song = {
    name : Text;
    description : Text;
    notes : [(Note, Nat)];
    bars : Nat;
    annotations : Text;
  };

  type HoleLayout = {
    position : {
      x : Float;
      y : Float;
    };
    size : Float;
  };

  type OcarinaLayout = {
    holes : [HoleLayout];
    imageRef : Text;
    mouthpiece : {
      position : { x : Float; y : Float };
      orientation : Float;
      length : Float;
      thickness : Float;
    };
  };

  type SoundSettings = {
    tone : {
      character : Float;
      warmth : Float;
    };
    reverb : {
      amount : Float;
      reverbType : Text;
      delay : Float;
      mix : Float;
    };
    pitchOffset : {
      cents : Int;
      semitones : Int;
      frequencyRatio : Float;
    };
  };

  type SoundPreset = {
    name : Text;
    soundSettings : SoundSettings;
    ocarinaImage : ?Text;
  };

  let fingeringPatterns = Map.empty<Note, FingeringPattern>();
  let songs = Map.empty<Text, Song>();
  let soundPresets = Map.empty<Text, SoundPreset>();
  let presetSongs = Map.fromArray<Text, Song>(
    [
      (
        "folk",
        {
          name = "Strolling Meadows";
          description = "Folk genre. Features a calm, melodic tune with C, D, E, G notes.";
          notes = [
            ({ name = "C"; octave = 5 }, 500),
            ({ name = "D"; octave = 5 }, 600),
            ({ name = "E"; octave = 5 }, 600),
            ({ name = "G"; octave = 5 }, 800),
            ({ name = "C"; octave = 5 }, 500),
            ({ name = "D"; octave = 5 }, 600),
            ({ name = "E"; octave = 5 }, 600),
            ({ name = "G"; octave = 5 }, 800),
          ];
          bars = 4;
          annotations = "Bar lines at 4th and 8th notes. C5-D5-E5 utilize ocarina's range. G5 is higher. This melody is quintessential folk style.";
        },
      ),
      (
        "folk_melody_1",
        {
          name = "Mountain Streams";
          description = "A calming folk melody with a repetitive motif, using C5, D5, E5, and G5.";
          notes = [
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "D"; octave = 5 }, 500),
            ({ name = "E"; octave = 5 }, 600),
            ({ name = "D"; octave = 5 }, 700),
            ({ name = "C"; octave = 5 }, 500),
            ({ name = "G"; octave = 5 }, 800),
            ({ name = "E"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 600),
          ];
          bars = 8;
          annotations = "Every 4 notes form a repeating pattern with a rising and falling motion. C5 and G5 create a calming effect.";
        },
      ),
      (
        "folk_melody_2",
        {
          name = "Wind Through Pines";
          description = "Folk melody that uses D5 as a pivot between C5 and G5.";
          notes = [
            ({ name = "D"; octave = 5 }, 500),
            ({ name = "C"; octave = 5 }, 600),
            ({ name = "G"; octave = 5 }, 700),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "D"; octave = 5 }, 500),
            ({ name = "G"; octave = 5 }, 800),
            ({ name = "C"; octave = 5 }, 600),
            ({ name = "D"; octave = 5 }, 450),
          ];
          bars = 7;
          annotations = "Motif repeats every 4 notes. D5 is strategically placed as a connecting tone. C5/G5 provide a stable, folk-like feel.";
        },
      ),
      (
        "folk_melody_3",
        {
          name = "Sunrise Waltz";
          description = "Folk waltz with variations and an accentuated first beat.";
          notes = [
            ({ name = "C"; octave = 5 }, 300),
            ({ name = "E"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "D"; octave = 5 }, 300),
            ({ name = "E"; octave = 5 }, 350),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 350),
            ({ name = "E"; octave = 5 }, 300),
          ];
          bars = 8;
          annotations = "Patterns repeat every 2 bars with variations. C5, E5, and G5 create a bright, waltzing effect typical of folk music.";
        },
      ),
      (
        "rock",
        {
          name = "Guitar Hero";
          description = "Rock genre. Strong use of G, C, D chords with dynamic rhythm.";
          notes = [
            ({ name = "G"; octave = 5 }, 300),
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "D"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 300),
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "D"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 300),
            ({ name = "G"; octave = 6 }, 600),
          ];
          bars = 6;
          annotations = "Bar lines at every 6 notes. The use of C5 and G6 highlights the ocarina's tonal versatility in rock style.";
        },
      ),
      (
        "rock_melody_1",
        {
          name = "Rock Ballad";
          description = "Ballad-style rock melody with a chorus of C5, G5, and D5.";
          notes = [
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 500),
            ({ name = "D"; octave = 5 }, 350),
            ({ name = "G"; octave = 5 }, 300),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "D"; octave = 5 }, 450),
            ({ name = "G"; octave = 6 }, 600),
          ];
          bars = 6;
          annotations = "Chorus repeats after every 4 notes. C5 and G5 are emphasized for a classic rock flavor.";
        },
      ),
      (
        "rock_melody_2",
        {
          name = "Electric Drive";
          description = "Quick-paced rock melody using all three chords with varying durations.";
          notes = [
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "G"; octave = 5 }, 400),
            ({ name = "D"; octave = 5 }, 350),
            ({ name = "C"; octave = 5 }, 300),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 6 }, 350),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "D"; octave = 5 }, 350),
          ];
          bars = 7;
          annotations = "Phrases repeat every 4 bars, creating a strong rock drive. G5 and C5 provide a stable base, with D5 adding movement.";
        },
      ),
      (
        "rock_melody_3",
        {
          name = "Power Chord Groove";
          description = "Rock groove with power chords and rhythmic shifts.";
          notes = [
            ({ name = "G"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "G"; octave = 5 }, 300),
            ({ name = "C"; octave = 5 }, 500),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "D"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 300),
          ];
          bars = 13;
          annotations = "Repeating power chord pattern with subtle variations. G5 and C5 are central, while D5 provides rhythm changes.";
        },
      ),
      (
        "electronic",
        {
          name = "Synth Space";
          description = "Electronic genre. Repeats with varying pitches using C5, E5, G5, C6.";
          notes = [
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 6 }, 600),
            ({ name = "G"; octave = 6 }, 800),
          ];
          bars = 8;
          annotations = "Bar lines at every 4 notes. C5 and G6 highlight the dynamic and high-pitched sound typical of electronic music.";
        },
      ),
      (
        "electronic_melody_1",
        {
          name = "Laser Dance";
          description = "High-pitched sequence for electronic music with a repeating pattern.";
          notes = [
            ({ name = "C"; octave = 5 }, 300),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 500),
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "G"; octave = 5 }, 500),
            ({ name = "E"; octave = 5 }, 400),
            ({ name = "C"; octave = 6 }, 600),
            ({ name = "G"; octave = 6 }, 800),
          ];
          bars = 10;
          annotations = "Cycles every 2 bars, with emphasis on higher notes. C5, E5, and G5 create an energetic, pulsating electronic sound.";
        },
      ),
      (
        "electronic_melody_2",
        {
          name = "Digital Flow";
          description = "Classic electronic flow with high-pitched tones and recurring motif.";
          notes = [
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 6 }, 400),
            ({ name = "G"; octave = 6 }, 600),
            ({ name = "E"; octave = 5 }, 300),
            ({ name = "G"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 600),
          ];
          bars = 6;
          annotations = "Pattern repeats after the fourth note. G5/G6 transitions provide a high-tech, digital sound.";
        },
      ),
      (
        "electronic_melody_3",
        {
          name = "Electronic Waves";
          description = "Wavy melody typical of electronic music using higher notes.";
          notes = [
            ({ name = "G"; octave = 6 }, 350),
            ({ name = "E"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 300),
            ({ name = "E"; octave = 5 }, 350),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 350),
            ({ name = "E"; octave = 5 }, 300),
          ];
          bars = 8;
          annotations = "Repeating scale patterns with variations. G6 and E5 are central, with C5 adding harmonic shifts.";
        },
      ),
      (
        "reggaeton",
        {
          name = "Dance Beat";
          description = "Reggaeton genre. Chord progression with C major, G major, D minor, and F major.";
          notes = [
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 6 }, 600),
            ({ name = "G"; octave = 6 }, 800),
          ];
          bars = 4;
          annotations = "Bar lines at 4th and 8th notes. Uses C, E, G, and higher C notes to create a vibrant reggae-inspired dance rhythm.";
        },
      ),
      (
        "reggaeton_melody_1",
        {
          name = "Island Rhythm";
          description = "Slower reggaeton rhythm with tonal changes and deeper C5 notes.";
          notes = [
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "E"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 500),
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "D"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 350),
            ({ name = "C"; octave = 6 }, 500),
          ];
          bars = 7;
          annotations = "Repeats with minor variations after every 4 bars. C5 serves as base note for the rhythm.";
        },
      ),
      (
        "reggaeton_melody_2",
        {
          name = "Tropical Vibe";
          description = "Uplifting melody for reggaeton with alternating tones and syncopated rhythm.";
          notes = [
            ({ name = "E"; octave = 5 }, 350),
            ({ name = "D"; octave = 5 }, 400),
            ({ name = "C"; octave = 5 }, 500),
            ({ name = "G"; octave = 5 }, 350),
            ({ name = "D"; octave = 5 }, 400),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "C"; octave = 5 }, 500),
            ({ name = "G"; octave = 6 }, 600),
          ];
          bars = 5;
          annotations = "Polyphonic sequence with syncopated beats. D5 and G5 add dynamic rhythm section to the melody.";
        },
      ),
      (
        "reggaeton_melody_3",
        {
          name = "Morning Sunrise";
          description = "Calm melody with reggae-infused rhythm and uplifting tones.";
          notes = [
            ({ name = "G"; octave = 6 }, 400),
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "E"; octave = 5 }, 500),
            ({ name = "G"; octave = 5 }, 400),
            ({ name = "C"; octave = 6 }, 350),
            ({ name = "G"; octave = 5 }, 550),
            ({ name = "D"; octave = 5 }, 300),
            ({ name = "C"; octave = 5 }, 400),
          ];
          bars = 10;
          annotations = "Repeating series with slight variations. G6 and C5 create a calming, flowing ambiance.";
        },
      ),
      (
        "reggae_1",
        {
          name = "Positive Vibration";
          description = "Reggae melody inspired by Bob Marley with a rising and repetitive motif.";
          notes = [
            ({ name = "C"; octave = 5 }, 350),
            ({ name = "E"; octave = 5 }, 400),
            ({ name = "G"; octave = 5 }, 650),
            ({ name = "C"; octave = 5 }, 300),
            ({ name = "D"; octave = 5 }, 550),
            ({ name = "E"; octave = 5 }, 450),
            ({ name = "G"; octave = 5 }, 350),
            ({ name = "C"; octave = 6 }, 500),
          ];
          bars = 8;
          annotations = "Verses repeat with chorus ending. Tonal center is C5 with E5/G5 providing harmonic variety.";
        },
      ),
      (
        "reggae_2",
        {
          name = "Roots Melody";
          description = "Classic reggae roots pattern with strong backbeat emphasis.";
          notes = [
            ({ name = "C"; octave = 5 }, 250),
            ({ name = "E"; octave = 5 }, 350),
            ({ name = "G"; octave = 5 }, 450),
            ({ name = "C"; octave = 5 }, 800),
            ({ name = "D"; octave = 5 }, 350),
            ({ name = "E"; octave = 5 }, 800),
            ({ name = "G"; octave = 5 }, 400),
            ({ name = "C"; octave = 6 }, 500),
          ];
          bars = 8;
          annotations = "Chorus cycles every 4 bars. Backbeat is emphasized on last 2 notes of each sequence. Repeated chords solidify the reggae rhythm.";
        },
      ),
    ]
  );

  var currentOctave = 4;
  var customOcarinaLayout : ?OcarinaLayout = null;
  var soundSettings : SoundSettings = {
    tone = { character = 0.5; warmth = 0.5 };
    reverb = { amount = 0.5; reverbType = "standard"; delay = 0.2; mix = 0.5 };
    pitchOffset = { cents = 0; semitones = 0; frequencyRatio = 1.0 };
  };
  let users = Map.empty<Principal, Text>();

  public query ({ caller }) func getFingeringPattern(note : Note) : async FingeringPattern {
    assertUserExists(caller);
    switch (fingeringPatterns.get(note)) {
      case (null) { Runtime.trap("Fingering pattern not found") };
      case (?pattern) { pattern };
    };
  };

  public shared ({ caller }) func updateFingeringPattern(note : Note, pattern : FingeringPattern) : async () {
    assertUserExists(caller);
    fingeringPatterns.add(note, pattern);
  };

  public shared ({ caller }) func addSong(song : Song) : async () {
    assertUserExists(caller);
    songs.add(song.name, song);
  };

  public shared ({ caller }) func updateCustomOcarinaLayout(layout : OcarinaLayout) : async () {
    assertUserExists(caller);
    customOcarinaLayout := ?layout;
  };

  public shared ({ caller }) func updateSoundSettings(newSettings : SoundSettings) : async () {
    assertUserExists(caller);
    soundSettings := newSettings;
  };

  public shared ({ caller }) func registerUser(username : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered");
    };
    users.add(caller, username);
  };

  public query ({ caller }) func getCurrentOctave() : async Nat {
    assertUserExists(caller);
    currentOctave;
  };

  public shared ({ caller }) func setCurrentOctave(octave : Nat) : async () {
    assertUserExists(caller);
    currentOctave := octave;
  };

  public query ({ caller }) func getCustomOcarinaLayout() : async ?OcarinaLayout {
    assertUserExists(caller);
    customOcarinaLayout;
  };

  public query ({ caller }) func getSoundSettings() : async SoundSettings {
    assertUserExists(caller);
    soundSettings;
  };

  public query ({ caller }) func getAllSongs() : async [Song] {
    assertUserExists(caller);
    songs.values().toArray();
  };

  public query ({ caller }) func getAllPresetSongs() : async [Song] {
    assertUserExists(caller);
    presetSongs.values().toArray();
  };

  public query ({ caller }) func getUsername(user : Principal) : async Text {
    assertUserExists(caller);
    switch (users.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?username) { username };
    };
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, Text)] {
    assertUserExists(caller);
    users.toArray();
  };

  public query ({ caller }) func getNumberOfHoles() : async Nat {
    assertUserExists(caller);
    switch (customOcarinaLayout) {
      case (null) {
        Runtime.trap("No custom ocarina layout found. Please set the layout first.");
      };
      case (?layout) { layout.holes.size() };
    };
  };

  public query ({ caller }) func getHoleLayout(holeIndex : Nat) : async HoleLayout {
    assertUserExists(caller);
    switch (customOcarinaLayout) {
      case (null) {
        Runtime.trap("No custom ocarina layout found. Please set the layout first.");
      };
      case (?layout) {
        if (holeIndex < layout.holes.size()) { layout.holes[holeIndex] } else {
          Runtime.trap("Invalid hole index");
        };
      };
    };
  };

  public query ({ caller }) func getAllHoleLayouts() : async [HoleLayout] {
    assertUserExists(caller);
    switch (customOcarinaLayout) {
      case (null) { Runtime.trap("No custom ocarina layout found. Please set the layout first.") };
      case (?layout) { layout.holes };
    };
  };

  public shared ({ caller }) func saveSoundPreset(name : Text, ocarinaImage : ?Text) : async () {
    assertUserExists(caller);
    let preset : SoundPreset = {
      name;
      ocarinaImage;
      soundSettings;
    };
    soundPresets.add(name, preset);
  };

  public query ({ caller }) func getSoundPreset(presetName : Text) : async SoundPreset {
    assertUserExists(caller);
    switch (soundPresets.get(presetName)) {
      case (null) { Runtime.trap("Could not find sound preset: " # presetName) };
      case (?preset) { preset };
    };
  };

  public query ({ caller }) func getAllSoundPresets() : async [SoundPreset] {
    assertUserExists(caller);
    soundPresets.values().toArray();
  };

  func assertUserExists(user : Principal) {
    if (not users.containsKey(user)) {
      Runtime.trap("User does not exist. Please register.");
    };
  };
};
