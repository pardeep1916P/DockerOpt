# Non-optimal Python Dockerfile
FROM python:3.12

RUN apt-get update && apt-get install -y gcc g++ make curl wget

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 5000

CMD ["python", "app.py"]
