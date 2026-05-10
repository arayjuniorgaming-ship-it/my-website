let move_speed = 3, grativy = 0.5;

let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let sound_point = new Audio('sounds/point.mp3');
let sound_die = new Audio('sounds/die.mp3');
// Tambahkan audio lain jika ada

// getting bird element properties
let bird_props = bird.getBoundingClientRect();

// This method returns DOMReact -> top, right, bottom, left, x, y, width and height
let background = document.querySelector('.background').getBoundingClientRect();

let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');

let game_state = 'Start';
img.style.display = 'none';
message.classList.add('messageStyle');

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && game_state !== 'Play') {
        // Hapus semua pipa
        document.querySelectorAll('.pipe_sprite').forEach(e => e.remove());
        img.style.display = 'block';
        bird.style.top = '40vh';
        game_state = 'Play';
        message.innerHTML = '';
        score_title.innerHTML = 'Score : ';
        score_val.innerHTML = '0';
        message.classList.remove('messageStyle');
        play();
    }
});

let checkpointScore = 0;
let checkpointBirdTop = '40vh';
let checkpointLevel = 1;

const finishScore = 30; // skor untuk finish

document.addEventListener('keydown', (e) => {
    if(e.key.toLowerCase() == 'c' && game_state == 'End' && checkpointScore > 0){
        // Kembalikan skor dan posisi burung ke checkpoint
        score_val.innerHTML = checkpointScore;
        bird.style.top = checkpointBirdTop;
        img.style.display = 'block';
        game_state = 'Play';
        message.innerHTML = '';
        message.classList.remove('messageStyle');
        level = checkpointLevel;
        updateLevelDisplay();
        play();
    }
});

function setGraphics(mode) {
    document.body.classList.remove('graphics-smooth', 'graphics-standard', 'graphics-high');
    if (mode === 'smooth') {
        document.body.classList.add('graphics-smooth');
    } else if (mode === 'standard') {
        document.body.classList.add('graphics-standard');
    } else if (mode === 'high') {
        document.body.classList.add('graphics-high');
    }
    else if (mode === 'ultra') {
        document.body.classList.add('graphics-ultra');
    }
    localStorage.setItem('graphicsMode', mode);
    document.getElementById('graphics-select').style.display = 'none';
}

// Terapkan mode grafik dari localStorage jika ada
const savedGraphics = localStorage.getItem('graphicsMode');
if (savedGraphics) {
    setGraphics(savedGraphics);
}

function play() {
    bird_dy = 0;
    level = 1;
    move_speed = 3; 
    updateLevelDisplay();
    move();
    apply_gravity();
    create_pipe();
}

function move() {
    if(game_state != 'Play' || isPaused) return;

    let pipe_sprite = document.querySelectorAll('.pipe_sprite');
    pipe_sprite.forEach((element) => {
        let pipe_sprite_props = element.getBoundingClientRect();
        bird_props = bird.getBoundingClientRect();

        if(pipe_sprite_props.right <= 0){
            element.remove();
        }else{
            if(bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width && bird_props.left + bird_props.width > pipe_sprite_props.left && bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height && bird_props.top + bird_props.height > pipe_sprite_props.top){
                game_state = 'End';
                message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Press Enter To Restart<br>Press C for Checkpoint';
                message.classList.add('messageStyle');
                img.style.display = 'none';
                sound_die.play();
                return;
            }else{
                if(pipe_sprite_props.right < bird_props.left && pipe_sprite_props.right + move_speed >= bird_props.left && element.increase_score == '1'){
                    score_val.innerHTML = +score_val.innerHTML + 1;
                    if (parseInt(score_val.innerHTML) > highScore) {
                        highScore = parseInt(score_val.innerHTML);
                        localStorage.setItem('highScore', highScore);
                        updateHighScoreDisplay();
                    }

                    // Tambahkan checkpoint setiap kelipatan 10
                    if (parseInt(score_val.innerHTML) % 10 === 0) {
                        checkpointScore = parseInt(score_val.innerHTML);
                        checkpointBirdTop = bird.style.top;
                        checkpointLevel = level;
                    }

                    // Cek apakah sudah finish
                    if (parseInt(score_val.innerHTML) >= finishScore) {
                        game_state = 'Finish';

                        // Update high score jika perlu
                        if (parseInt(score_val.innerHTML) > highScore) {
                            highScore = parseInt(score_val.innerHTML);
                            localStorage.setItem('highScore', highScore);
                            updateHighScoreDisplay();
                        }

                        message.innerHTML = 
                            'You Win!'.fontcolor('lime') +
                            '<br>High Score: <span style="color: gold;">' + highScore + '</span>' +
                            '<br>Press Enter to Play Again';
                        message.classList.add('messageStyle');
                        img.style.display = 'none';
                        return;
                    }

                    // Cek naik level
                    if (parseInt(score_val.innerHTML) % levelUpScore === 0) {
                        level++;
                        move_speed += 1; // Atau ubah gap pipa, dsb
                        updateLevelDisplay();
                        // Bisa tambahkan efek/teks "Level Up!" di layar
                    }
                    
                    // === New: cek untuk night mode pada skor tertentu ===
                    const currentScore = parseInt(score_val.innerHTML);
                    // Aktifkan night mode ketika skor >= 60
                    if (currentScore >= 60 && !document.body.classList.contains('night-mode')) {
                        enableNightMode();
                        // simpan supaya tetap kalau reload
                        localStorage.setItem('nightMode', '1');
                    }
                    // Jika ingin kembali ke siang saat turun di bawah 60 (opsional)
                    if (currentScore < 60 && document.body.classList.contains('night-mode')) {
                        disableNightMode();
                        localStorage.removeItem('nightMode');
                    }
                    // === end new ===
                }
                element.style.left = pipe_sprite_props.left - move_speed + 'px';
            }
        }
    });
    requestAnimationFrame(move);
}

function apply_gravity() {
    if(game_state != 'Play' || isPaused) return;
    bird_dy = bird_dy + grativy;
    document.addEventListener('keydown', (e) => {
        if(e.key == 'ArrowUp' || e.key == ' '){
            img.src = 'images/Bird-2.png';
            bird_dy = -7.6;
        }
    });

    document.addEventListener('keyup', (e) => {
        if(e.key == 'ArrowUp' || e.key == ' '){
            img.src = 'images/Bird.png';
        }
    });

    if(bird_props.top <= 0 || bird_props.bottom >= background.bottom){
        game_state = 'End';
        message.style.left = '28vw';
        window.location.reload();
        message.classList.remove('messageStyle');
        return;
    }
    bird.style.top = bird_props.top + bird_dy + 'px';
    bird_props = bird.getBoundingClientRect();
    requestAnimationFrame(apply_gravity);
}

let pipe_seperation = 0;

let pipe_gap = 35;

function create_pipe(){
    if(game_state != 'Play') return;

    if(pipe_seperation > 115){
        pipe_seperation = 0;

        let pipe_posi = Math.floor(Math.random() * 43) + 8;
        let pipe_sprite_inv = document.createElement('div');
        pipe_sprite_inv.className = 'pipe_sprite';
        pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
        pipe_sprite_inv.style.left = '100vw';

        document.body.appendChild(pipe_sprite_inv);
        let pipe_sprite = document.createElement('div');
        pipe_sprite.className = 'pipe_sprite';
        pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
        pipe_sprite.style.left = '100vw';
        pipe_sprite.increase_score = '1';

        document.body.appendChild(pipe_sprite);
    }
    pipe_seperation++;
    requestAnimationFrame(create_pipe);
}

// Audio toggle
let audioOn = true;
function toggleAudio() {
    audioOn = !audioOn;
    document.getElementById('audio-status').innerText = audioOn ? 'On' : 'Off';
}

// Reset high score
function resetHighScore() {
    localStorage.setItem('highScore', 0);
    highScore = 0;
    updateHighScoreDisplay();
}

// Buka menu grafik (tampilkan kembali pilihan grafik)
function openGraphics() {
    document.getElementById('graphics-select').style.display = 'flex';
}

// Buka modal pengaturan
document.getElementById('open-settings').onclick = function() {
    document.getElementById('settings-modal').classList.add('active');
    isPaused = true;
};

// Tutup modal pengaturan
document.getElementById('close-settings').onclick = function() {
    document.getElementById('settings-modal').classList.remove('active');
    isPaused = false;
    // Lanjutkan animasi
    if(game_state === 'Play') {
        move();
        apply_gravity();
    }
};

// Tutup modal jika klik di luar konten
document.getElementById('settings-modal').onclick = function(e) {
    if (e.target === this) {
        this.classList.remove('active');
        isPaused = false;
        if(game_state === 'Play') {
            requestAnimationFrame(move);
            requestAnimationFrame(apply_gravity);
        }
    }
};

document.addEventListener('keydown', function(e) {
    // Jika ESC ditekan dan modal belum terbuka, buka pengaturan
    if (e.key === 'Escape') {
        const modal = document.getElementById('settings-modal');
        if (!modal.classList.contains('active')) {
            modal.classList.add('active');
            isPaused = true;
        } else {
            // Jika sudah terbuka, tutup pengaturan
            modal.classList.remove('active');
            isPaused = false;
            if(game_state === 'Play') {
                move();
                apply_gravity();
            }
        }
    }
});

let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;

function updateHighScoreDisplay() {
    let el = document.getElementById('highscore_val');
    if (el) el.innerText = highScore;
}
updateHighScoreDisplay(); // Panggil saat halaman dimuat

sound_point.volume = 1;
sound_die.volume = 1;

let isPaused = false;

let level = 1;
let levelUpScore = 10; // Skor untuk naik level, bisa diubah sesuai keinginan

function updateLevelDisplay() {
    let el = document.getElementById('level_val');
    if (el) el.innerText = level;
}

// Tambahkan fungsi night mode di bagian bawah file (mis. sebelum updateHighScoreDisplay atau di akhir)
function enableNightMode() {
    document.body.classList.add('night-mode');
    // Contoh: kurangi volume musik/ubah suara (jika ada)
    // if(sound_point) sound_point.volume = 0.6;
}

function disableNightMode() {
    document.body.classList.remove('night-mode');
    // if(sound_point) sound_point.volume = 1;
}

// Terapkan night mode dari localStorage saat load
if (localStorage.getItem('nightMode') === '1') {
    enableNightMode();
}