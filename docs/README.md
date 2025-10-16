# 📖 Documentation Index

Welcome to the BookStore Performance Testing POC documentation!

## 🚀 Quick Start (3 Commands)

```bash
make run-aspire         # Start everything
make perf-workspace     # Open dashboards (3 tabs)
make perf-ai-smoke      # Run 3-min test
```

---

## 📚 Documentation Files

### ⭐ Essential Reading

1. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** ← START HERE
   - Where every file lives
   - What each folder does
   - Common task guides
   - Configuration cheat sheet

2. **[LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)** ← LLM SETUP
   - Setup Ollama, LM Studio, Claude, OpenAI, Bedrock
   - Switch providers without code changes
   - Zero-cost testing with local models
   - Provider comparison guide

3. **[MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md)** ← COMMAND GUIDE
   - All 50+ Makefile commands explained
   - Performance testing workflows
   - Monitoring dashboards
   - Troubleshooting commands

### 📖 Additional Documentation

4. **[../CLAUDE.md](../CLAUDE.md)** - Complete technical documentation
   - Architecture patterns
   - OpenTelemetry setup
   - Aspire integration
   - Migration guidance

5. **[MIGRATION_TO_HUB_SERVICES.md](MIGRATION_TO_HUB_SERVICES.md)** - Production migration guide
6. **[MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)** - Phase 1 checklist

---

## 🎯 Quick Navigation

### "I want to..."

| Task | Document | Section |
|------|----------|---------|
| **Get started fast** | [README.md](../README.md) | Quick Start |
| **Understand the project structure** | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Folder tree |
| **Setup an LLM provider** | [LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md) | Provider-specific setup |
| **Run performance tests** | [MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md) | Performance Testing |
| **Switch LLM providers** | [LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md) | Quick Provider Setup |
| **View live metrics** | [MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md) | Monitoring & Dashboards |
| **Add a new provider** | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | "I want to add a new LLM provider" |
| **Troubleshoot issues** | [MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md) | Troubleshooting & Maintenance |
| **Understand architecture** | [../CLAUDE.md](../CLAUDE.md) | Architecture Patterns |

---

## 💡 The One File You Need

**Single Configuration File:**
```
BookStore.Service/appsettings.json
```

This file controls:
- ✅ LLM Provider selection
- ✅ API keys for Claude/OpenAI
- ✅ Local LLM URLs (Ollama/LM Studio)
- ✅ Database connections
- ✅ OpenTelemetry settings

**Everything else is already configured!**

---

## 🚀 Common Workflows

### First-Time Setup
```bash
# 1. Start services
make run-aspire

# 2. Open dashboards
make perf-workspace

# 3. Run quick test
make perf-ai-smoke

# That's it!
```

### Switch LLM Provider
```bash
# 1. Edit appsettings.json
#    Change: "Provider": "Ollama" → "Provider": "LMStudio"

# 2. Restart
make restart

# 3. Test
make perf-ai-smoke

# Done!
```

### Performance Testing Session
```bash
# 1. Start everything
make run-aspire

# 2. Open workspace (3 browser tabs)
make perf-workspace
#    Tab 1: Dashboard - Click "Start Load Test"
#    Tab 2: Grafana - Watch metrics live
#    Tab 3: Aspire - Monitor service health

# 3. View results
make perf-report
```

---

## 📊 What's Included

- **5 LLM Providers**: Ollama, LM Studio, Claude, OpenAI, Bedrock
- **10 Grafana Dashboards**: 91 total widgets
- **12+ K6 Test Scenarios**: Smoke, load, stress, chaos, AI, mixed
- **50+ Makefile Commands**: Fully automated workflows
- **Web UI Dashboard**: Point-and-click performance testing
- **Real-time Metrics**: All providers → Prometheus → Grafana
- **Zero-Cost Testing**: Ollama & LM Studio (free local models)

---

## 🆘 Need Help?

### Quick Fixes
```bash
make health-check    # Test all endpoints
make restart         # Restart services
make reset           # Nuclear option (clean everything)
```

### Documentation
- **Stuck?** → [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **LLM issues?** → [LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)
- **Command not working?** → [MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md)
- **Architecture questions?** → [../CLAUDE.md](../CLAUDE.md)

### Resources
- **Aspire Docs**: [.NET Aspire Documentation](https://learn.microsoft.com/en-us/dotnet/aspire/)
- **K6 Docs**: [K6 Performance Testing](https://k6.io/docs/)
- **Grafana Docs**: [Grafana Documentation](https://grafana.com/docs/)
- **OpenTelemetry**: [OpenTelemetry .NET](https://opentelemetry.io/docs/languages/net/)

---

## 📈 What Makes This Special

1. **Single Config File**: Everything in `appsettings.json`
2. **One Command Start**: `make run-aspire` does it all
3. **Zero-Cost Testing**: Free local LLMs (Ollama, LM Studio)
4. **Real-time Visibility**: Live metrics in Grafana
5. **Web UI**: Point-and-click testing (no command line needed)
6. **Multi-Provider**: Switch LLMs without code changes
7. **Production-Ready**: Based on hub-services architecture

---

## 🎓 Learning Path

**Beginner:**
1. Read [README.md](../README.md)
2. Run `make run-aspire`
3. Run `make perf-smoke`

**Intermediate:**
1. Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
2. Read [LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)
3. Try switching providers
4. Run `make perf-ai-load`

**Advanced:**
1. Read [../CLAUDE.md](../CLAUDE.md)
2. Read [MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md)
3. Explore all dashboards
4. Run `make perf-chaos`
5. Customize K6 scenarios

---

## 💻 For Claude Code / AI Assistants

When helping users with this project:

1. **Configuration**: Always reference `BookStore.Service/appsettings.json`
2. **Commands**: Always use Makefile commands (see MAKEFILE_REFERENCE.md)
3. **LLM Setup**: Always reference LLM_PROVIDER_GUIDE.md
4. **Structure**: Always reference PROJECT_STRUCTURE.md for file locations
5. **Full Details**: Always reference CLAUDE.md for architecture

**Key principle:** One config file (`appsettings.json`), one command (`make run-aspire`)

---

## 📝 Contributing

When adding new features:

1. **LLM Provider**: See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) → "I want to add a new LLM provider"
2. **K6 Test**: See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) → "I want to add a new K6 test scenario"
3. **Dashboard**: See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) → "I want to add a new Grafana dashboard"
4. **Documentation**: Update this index and relevant guide

---

**Happy Testing! 🚀**
