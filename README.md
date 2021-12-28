# control you verdaccio permission

```yml
middlewares:
  dist-tag-control:
    permission:
      '@myscope/foo':
        latest:
          - lucy
          - jack
      '@myscope/bar':
        next:
          - lady
          - gaga
    enabled: true
```
