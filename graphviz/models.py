from django.db import models
from django.contrib.sessions.models import Session


class DAG(models.Model):
    session = models.ForeignKey(Session)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Node(models.Model):
    dag = models.ForeignKey(DAG)
    node_id = models.CharField(max_length=100, db_index=True)
    label = models.CharField(max_length=255)
    weight = models.IntegerField(default=1)

    def __unicode__(self):
        return self.label


class Edge(models.Model):
    dag = models.ForeignKey(DAG)
    from_node = models.ForeignKey(Node, related_name='fromnode')
    to_node = models.ForeignKey(Node, related_name='tonode')