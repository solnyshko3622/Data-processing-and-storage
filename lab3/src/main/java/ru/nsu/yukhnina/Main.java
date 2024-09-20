package ru.nsu.yukhnina;


public class Main {
    public static void main(String[] args) {
        Thread thread1 = new Thread(new MyThread(new String[]{"Thread1 start",
                "Thread1 work1", "Thread1 work2", "Thread1 work3",
                "Thread1 work4", "Thread1 work5", "Thread1 stop"}));
        Thread thread2 = new Thread(new MyThread(new String[]{"Thread2 start",
                "Thread2 work1", "Thread2 work2", "Thread2 work3",
                "Thread2 work4", "Thread2 work5", "Thread2 stop"}));
        Thread thread3 = new Thread(new MyThread(new String[]{"Thread3 start",
                "Thread3 work1", "Thread3 work2", "Thread3 work3",
                "Thread3 work4", "Thread3 work5", "Thread3 stop"}));
        Thread thread4 = new Thread(new MyThread(new String[]{"Thread4 start",
                "Thread4 work1", "Thread4 work2", "Thread4 work3",
                "Thread4 work4", "Thread4 work5", "Thread4 stop"}));
        thread1.start();
        thread2.start();
        thread3.start();
        thread4.start();
    }
}


class MyThread implements Runnable {
    private final String[] strings;

    public MyThread(String[] strings) {
        this.strings = strings;
    }

    @Override
    public void run() {
        for (String string : strings) {
            System.out.println(string);
        }
    }
}