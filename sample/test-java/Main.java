class Main {
    public static void main(String[] args) throws Exception {
        com.sun.net.httpserver.HttpServer server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress(8000), 0);
        server.createContext("/", t -> {
            String response = "{\"message\":\"Docker Size Test - Java\",\"status\":\"ok\"}";
            t.sendResponseHeaders(200, response.length());
            java.io.OutputStream os = t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        });
        server.setExecutor(null);
        System.out.println("Java Server running on port 8000");
        server.start();
    }
}
