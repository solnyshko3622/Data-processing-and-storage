package ru.nsu.yukhnina;


public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(
            new Runnable() {
                @Override
                public void run() {
                    while (!Thread.currentThread().isInterrupted()) {
                        System.out.println("Thread work");
                    }
                }
            }
        );
        thread.start();
        Thread.sleep(2000);
        thread.interrupt();
    }
}