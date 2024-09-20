package ru.nsu.yukhnina;


public class Main {
    public static void main(String[] args) throws InterruptedException {
        System.out.println("Parent start");
        Thread myThread = new Thread(
                new Runnable() {
                    public void run() {
                        System.out.println("Child start");
                        for (int i = 0; i < 5; i++) {
                            System.out.println("Thread work. Child");
                        }
                        System.out.println("Child stop");
                    }
                }
        );
        myThread.start();
        for (int i = 0; i < 5; i++) {
            System.out.println("Parent work");
        }
        System.out.println("Thread finished. Parent");
    }
}