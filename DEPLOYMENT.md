# 🚀 SHIM Production Deployment Guide

**Complete production infrastructure setup with Docker, Redis, Prometheus, and Grafana.**

---

## Quick Start (5 Minutes)

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for health checks
docker-compose ps

# 3. Access dashboards
# Grafana: http://localhost:3000 (admin / shim_admin_2026)
# Prometheus: http://localhost:9090
# Redis: localhost:6379
```

**That's it! Full production infrastructure is running.**

---

## Services Overview

### Redis (Port 6379)
**Purpose:** Task queues, message bus, worker registry

**Features:**
- BullMQ job queues
- Pub/Sub messaging
- Worker coordination
- Persistent storage (AOF)

**Health Check:**
```bash
docker exec shim-redis redis-cli ping
# Should return: PONG
```

### Prometheus (Port 9090)
**Purpose:** Metrics collection and storage

**Features:**
- 15-second scrape interval
- Cost metrics tracking
- Routing performance data
- Crash statistics

**Access:**
- URL: http://localhost:9090
- Metrics: http://localhost:9090/metrics
- Targets: http://localhost:9090/targets

**Sample Queries:**
```promql
# Total cost savings
sum(shim_cost_savings_total)

# Queries by model
sum by(model) (shim_queries_total)

# Average routing confidence
avg(shim_routing_confidence)

# Cost per query
rate(shim_cost_total[5m]) / rate(shim_queries_total[5m])
```

### Grafana (Port 3000)
**Purpose:** Visualization dashboards

**Features:**
- Pre-configured Prometheus datasource
- Cost optimization dashboard
- Real-time charts
- Alert management (optional)

**Access:**
- URL: http://localhost:3000
- Username: `admin`
- Password: `shim_admin_2026`

**Dashboards:**
1. **SHIM - Cost Optimization**
   - Total savings (monthly)
   - Savings percentage gauge
   - Queries by model (pie chart)
   - Cost per query timeline
   - Cumulative savings graph
   - Routing performance table

### SHIM Application (Optional)
**Purpose:** Main application (can run locally too)

**Features:**
- Crash prevention
- Cost optimization
- Multi-chat coordination
- Metrics export (port 9091)

**Health Check:**
```bash
curl http://localhost:9091/health
# Should return: {"status":"ok"}
```

---

## Configuration

### Environment Variables

Create `.env` file:
```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Metrics
PROMETHEUS_GATEWAY=http://localhost:9090
METRICS_PORT=9091

# Features
ENABLE_CRASH_PREVENTION=true
ENABLE_COST_OPTIMIZATION=true
ENABLE_MULTI_CHAT=true
ENABLE_EVOLUTION=true

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Checkpoints
CHECKPOINT_DIR=./checkpoints
CHECKPOINT_INTERVAL_MS=300000
```

### Docker Compose Overrides

Create `docker-compose.override.yml` for local customization:
```yaml
version: '3.8'

services:
  shim:
    environment:
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src  # Live reload
```

---

## Monitoring

### Key Metrics

**Cost Optimization:**
- `shim_cost_total` - Total cost spent
- `shim_cost_savings_total` - Total savings
- `shim_cost_by_model{model}` - Cost per model
- `shim_queries_total{model}` - Queries per model

**Routing Performance:**
- `shim_routing_confidence_avg` - Average confidence
- `shim_routing_duration_ms` - Routing latency
- `shim_model_selection{model}` - Model selection count

**Crash Prevention:**
- `shim_crashes_total` - Total crashes detected
- `shim_recoveries_total` - Successful recoveries
- `shim_checkpoint_duration_ms` - Checkpoint performance

**Multi-Chat:**
- `shim_active_chats` - Currently active chats
- `shim_tasks_queued` - Tasks in queue
- `shim_load_balance_events` - Rebalancing events

### Alerts (Optional)

Create `docker/prometheus/rules/alerts.yml`:
```yaml
groups:
  - name: shim_alerts
    interval: 30s
    rules:
      - alert: HighCostDetected
        expr: rate(shim_cost_total[5m]) > 1.0
        for: 5m
        annotations:
          summary: "High AI costs detected"
          description: "Cost rate exceeds $1/5min"
      
      - alert: LowSavingsRate
        expr: (shim_cost_savings_total / shim_cost_total) < 0.20
        for: 10m
        annotations:
          summary: "Savings rate below 20%"
          description: "Routing may not be optimal"
      
      - alert: FrequentCrashes
        expr: rate(shim_crashes_total[1h]) > 5
        for: 5m
        annotations:
          summary: "Frequent crashes detected"
          description: "More than 5 crashes/hour"
```

---

## Production Deployment

### Step 1: Prerequisites

```bash
# Docker & Docker Compose
docker --version  # Should be 20.10+
docker-compose --version  # Should be 2.0+

# Node.js (for local development)
node --version  # Should be 20+
npm --version   # Should be 10+
```

### Step 2: Build Images

```bash
# Build SHIM application image
docker-compose build shim

# Or build without cache
docker-compose build --no-cache shim
```

### Step 3: Start Services

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f shim
docker-compose logs -f redis
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### Step 4: Verify Health

```bash
# Check all services
docker-compose ps

# Should show all as "healthy" or "Up"

# Individual health checks
docker exec shim-redis redis-cli ping
curl http://localhost:9090/-/healthy
curl http://localhost:3000/api/health
curl http://localhost:9091/health  # If SHIM app running
```

### Step 5: Access Dashboards

1. **Grafana:** http://localhost:3000
   - Login: admin / shim_admin_2026
   - Navigate to "SHIM - Cost Optimization" dashboard
   
2. **Prometheus:** http://localhost:9090
   - Check targets: http://localhost:9090/targets
   - Should show all scrape targets as UP

3. **Redis CLI:**
   ```bash
   docker exec -it shim-redis redis-cli
   > PING
   PONG
   > KEYS *
   (empty or existing keys)
   ```

---

## Scaling

### Horizontal Scaling

Run multiple SHIM instances:

```yaml
# docker-compose.scale.yml
services:
  shim:
    deploy:
      replicas: 3
```

Start:
```bash
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

### Resource Limits

Add resource constraints:

```yaml
services:
  shim:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

---

## Backup & Restore

### Redis Data

**Backup:**
```bash
docker exec shim-redis redis-cli BGSAVE
docker cp shim-redis:/data/dump.rdb ./backups/redis-backup-$(date +%Y%m%d).rdb
```

**Restore:**
```bash
docker-compose down
docker cp ./backups/redis-backup-YYYYMMDD.rdb shim-redis:/data/dump.rdb
docker-compose up -d redis
```

### Prometheus Data

**Backup:**
```bash
docker cp shim-prometheus:/prometheus ./backups/prometheus-$(date +%Y%m%d)
```

**Restore:**
```bash
docker-compose down prometheus
docker cp ./backups/prometheus-YYYYMMDD shim-prometheus:/prometheus
docker-compose up -d prometheus
```

### Grafana Dashboards

**Export:**
```bash
curl -u admin:shim_admin_2026 \
  http://localhost:3000/api/dashboards/uid/DASHBOARD_UID \
  > dashboard-backup.json
```

**Import:**
```bash
curl -u admin:shim_admin_2026 \
  -H "Content-Type: application/json" \
  -d @dashboard-backup.json \
  http://localhost:3000/api/dashboards/db
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs SERVICE_NAME

# Common issues:
# 1. Port already in use
sudo lsof -i :PORT  # Find process using port

# 2. Volume permissions
docker-compose down -v  # Remove volumes
docker-compose up -d    # Recreate

# 3. Out of disk space
docker system prune -a  # Clean up
```

### Metrics Not Showing

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Check SHIM metrics endpoint
curl http://localhost:9091/metrics

# Restart Prometheus
docker-compose restart prometheus
```

### Dashboard Not Loading

```bash
# Check Grafana logs
docker-compose logs grafana

# Reset Grafana password
docker exec -it shim-grafana grafana-cli admin reset-admin-password NEW_PASSWORD

# Reimport dashboard
# Delete old dashboard in Grafana UI
# Restart Grafana
docker-compose restart grafana
```

---

## Maintenance

### Update Images

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove orphaned containers
docker-compose down --remove-orphans

# Clean system
docker system prune -a
```

### Logs Management

```bash
# View logs
docker-compose logs -f --tail=100 shim

# Rotate logs
docker-compose down
docker system prune -f
docker-compose up -d
```

---

## Security

### Change Default Passwords

**Grafana:**
```bash
# Update docker-compose.yml
GF_SECURITY_ADMIN_PASSWORD=YOUR_SECURE_PASSWORD

# Or use Grafana CLI
docker exec -it shim-grafana grafana-cli admin reset-admin-password YOUR_SECURE_PASSWORD
```

**Redis:**
```yaml
# Add to docker-compose.yml
command: redis-server --requirepass YOUR_REDIS_PASSWORD --appendonly yes
```

### Network Isolation

```yaml
# docker-compose.prod.yml
services:
  redis:
    networks:
      - backend  # Not exposed to public

  prometheus:
    networks:
      - backend
      - monitoring

  grafana:
    networks:
      - monitoring
      - frontend  # Only Grafana publicly accessible
```

### HTTPS/TLS

Add nginx reverse proxy:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - grafana
```

---

## Production Checklist

- [ ] All services start successfully
- [ ] Health checks passing
- [ ] Grafana accessible and showing data
- [ ] Prometheus scraping metrics
- [ ] Redis responding to commands
- [ ] SHIM application running (if containerized)
- [ ] Dashboards loading correctly
- [ ] Metrics updating in real-time
- [ ] Alerts configured (if enabled)
- [ ] Backups scheduled
- [ ] Logs rotating
- [ ] Security hardened (passwords changed)
- [ ] Resource limits set
- [ ] Monitoring alerts working
- [ ] Documentation updated

---

## Next Steps

1. **Run Demo:** Test cost optimization with real queries
2. **Monitor Metrics:** Watch savings accumulate in Grafana
3. **Tune Alerts:** Configure thresholds for your workload
4. **Scale Up:** Add more SHIM instances as needed
5. **Optimize:** Use metrics to improve routing strategies

---

**Your production infrastructure is ready! 🚀**

**Access Points:**
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Redis: localhost:6379
- SHIM Metrics: http://localhost:9091/metrics

**Credentials:**
- Grafana: admin / shim_admin_2026

---

*Last Updated: January 11, 2026*  
*Version: 1.0.0*  
*Status: Production Ready*
