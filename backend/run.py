from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "https://www.youtube.com/watch?v=7FVr8CFHHpg"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)